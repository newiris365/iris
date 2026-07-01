import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

// Input Zod schemas
const issueBookSchema = z.object({
  book_id: z.string().uuid(),
  student_id: z.string().uuid(),
  issue_date: z.string(),
  due_date: z.string()
});

const returnBookSchema = z.object({
  return_date: z.string(),
  condition_note: z.string().optional()
});

const registerEventSchema = z.object({
  student_id: z.string().uuid()
});

const checkinTicketSchema = z.object({
  ticket_number: z.string()
});

// 1. LIBRARY BOOK ISSUE WITH STOCK LIMIT CHECK
export async function issueBook(req: Request, res: Response) {
  try {
    const parseResult = issueBookSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { book_id, student_id, issue_date, due_date } = parseResult.data;

    // Call atomic RPC to prevent negative stock race condition
    const { data, error } = await supabaseAdmin
      .rpc('issue_book_atomic', {
        p_institution_id: req.user?.institution_id,
        p_book_id: book_id,
        p_student_id: student_id,
        p_issue_date: issue_date,
        p_due_date: due_date
      });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data.success) {
      return res.status(409).json({ success: false, error: data.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Book checked out successfully.',
      issue: {
        id: data.issue_id,
        book_id,
        student_id,
        issue_date,
        due_date,
        status: 'Issued'
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error processing book issue.' });
  }
}

// 2. RETURN BOOK
export async function returnBook(req: Request, res: Response) {
  try {
    const { issueId } = req.params;
    const parseResult = returnBookSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { return_date } = parseResult.data;

    // Call atomic RPC to prevent concurrent return increment anomalies
    const { data, error } = await supabaseAdmin
      .rpc('return_book_atomic', {
        p_issue_id: issueId,
        p_return_date: return_date
      });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data.success) {
      return res.status(400).json({ success: false, error: data.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Book returned successfully.',
      issue: {
        id: data.issue_id,
        return_date,
        fine_amount: data.fine_amount,
        status: 'Returned'
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error processing return.' });
  }
}

// 3. GET RECOMMENDATIONS (pgvector similarity mock mapping)
export async function getBookRecommendations(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    // 1. Fetch borrowing history of the student
    const { data: borrowingHistory } = await supabaseAdmin
      .from('book_issues')
      .select('book_id, books(category)')
      .eq('student_id', studentId);

    const categories = new Set<string>();
    const issuedBookIds: string[] = [];

    if (borrowingHistory) {
      borrowingHistory.forEach((record: any) => {
        if (record.book_id) {
          issuedBookIds.push(record.book_id);
          if (record.books && (record.books as any).category) {
            categories.add((record.books as any).category);
          }
        }
      });
    }

    // 2. Query recommended books
    let query = supabaseAdmin
      .from('books')
      .select('id, title, author, category, copies_available')
      .eq('institution_id', req.user?.institution_id);

    if (categories.size > 0) {
      query = query.in('category', Array.from(categories));
    }
    if (issuedBookIds.length > 0) {
      // format for not in filter in Supabase: list of values wrapped in parentheses
      query = query.not('id', 'in', `(${issuedBookIds.join(',')})`);
    }

    const { data: recommendations, error } = await query.limit(5);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Add match scores simulated based on category matching
    const recommendationsWithScore = (recommendations || []).map(b => ({
      ...b,
      match_score: categories.has(b.category) ? "95% Match (Same Category)" : "75% Match (Campus Popular)"
    }));

    // If we have fewer than 2 recommendations, fallback to returning top books
    if (recommendationsWithScore.length < 2) {
      const { data: fallbackBooks } = await supabaseAdmin
        .from('books')
        .select('id, title, author, category, copies_available')
        .eq('institution_id', req.user?.institution_id)
        .limit(5);

      const fallbackWithScore = (fallbackBooks || []).map(b => ({
        ...b,
        match_score: "80% Match (Campus Popular)"
      }));
      return res.status(200).json({ success: true, recommendations: fallbackWithScore });
    }

    return res.status(200).json({ success: true, recommendations: recommendationsWithScore });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error calculating recommendations.' });
  }
}

// 4. EVENT REGISTRATION WITH CAPACITY CAP CHECK
export async function registerEvent(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = registerEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id } = parseResult.data;

    // A. Check event capacity limits
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('max_participants')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ success: false, error: 'Event not found.' });
    }

    // B. Calculate current registrations count
    const { count, error: countError } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) {
      return res.status(500).json({ success: false, error: 'Failed to calculate registrations count.' });
    }

    if (event.max_participants && (count || 0) >= event.max_participants) {
      return res.status(409).json({ success: false, error: 'Event capacity limit reached. Registration denied.' });
    }

    // C. Write registration & ticket details
    const ticketNumber = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data: registration, error: regError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        student_id,
        ticket_number: ticketNumber,
        payment_status: 'Completed',
        attendance_marked: false
      })
      .select()
      .single();

    if (regError) {
      return res.status(509).json({ success: false, error: 'Student already registered for this event.' });
    }

    return res.status(200).json({ success: true, message: 'Registered successfully.', registration });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error processing event registration.' });
  }
}

// 5. VALIDATE & CHECKIN EVENT TICKET QR
export async function checkinTicket(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = checkinTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { ticket_number } = parseResult.data;

    // Verify ticket registration
    const { data: registration, error } = await supabaseAdmin
      .from('event_registrations')
      .select('id, attendance_marked')
      .eq('event_id', eventId)
      .eq('ticket_number', ticket_number)
      .single();

    if (error || !registration) {
      return res.status(404).json({ success: false, error: 'Invalid ticket number. Access Denied.' });
    }

    if (registration.attendance_marked) {
      return res.status(409).json({ success: false, error: 'Ticket ticket already checked-in previously.' });
    }

    // Check student in
    const { data: updatedReg } = await supabaseAdmin
      .from('event_registrations')
      .update({ attendance_marked: true })
      .eq('id', registration.id)
      .select()
      .single();

    return res.status(200).json({ success: true, message: 'Ticket validated. Welcome to event!', registration: updatedReg });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error validating ticket.' });
  }
}
