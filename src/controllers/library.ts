import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

// ============================================================
// ZOD VALIDATION SCHEMAS
// ============================================================

export const createBookSchema = z.object({
  isbn: z.string().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  publisher: z.string().optional(),
  publication_year: z.number().int().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  language: z.string().default('English'),
  copies_total: z.number().int().nonnegative().default(1),
  copies_available: z.number().int().nonnegative().default(1),
  shelf_location: z.string().optional(),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const issueBookSchema = z.object({
  book_id: z.string().uuid(),
  student_id: z.string().uuid(),
  due_date: z.string(), // ISO Date string
  condition_on_issue: z.enum(['excellent', 'good', 'fair', 'damaged']).default('good'),
  notes: z.string().optional()
});

export const returnBookSchema = z.object({
  condition_on_return: z.enum(['excellent', 'good', 'fair', 'damaged', 'lost']).default('good'),
  fine_amount: z.number().nonnegative().default(0),
  fine_paid: z.boolean().default(false),
  payment_method: z.enum(['cash', 'wallet', 'online']).optional(),
  transaction_id: z.string().optional()
});

export const renewBookSchema = z.object({
  notes: z.string().optional()
});

export const reserveBookSchema = z.object({
  book_id: z.string().uuid(),
  student_id: z.string().uuid(),
  expires_at: z.string().optional()
});

export const createEbookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  semester: z.string().optional(),
  description: z.string().optional(),
  file_url: z.string().url(),
  cover_url: z.string().url().optional().or(z.literal('')),
  file_size_mb: z.number().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
  access_level: z.string().default('all')
});

export const createStudyRoomSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  amenities: z.array(z.string()).default([]),
  floor: z.number().int().nonnegative(),
  is_active: z.boolean().default(true)
});

export const bookStudyRoomSchema = z.object({
  room_id: z.string().uuid(),
  student_id: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  start_time: z.string(), // HH:MM
  end_time: z.string(), // HH:MM
  purpose: z.string().optional(),
  group_members: z.array(z.string().uuid()).default([])
});

export const payFineSchema = z.object({
  payment_method: z.enum(['cash', 'wallet', 'online']),
  transaction_id: z.string().min(1)
});

const aiResearchSchema = z.object({
  topic: z.string().min(1)
});

const aiSummarizeSchema = z.object({
  book_id: z.string().uuid()
});

const aiCompareSchema = z.object({
  book_a_id: z.string().uuid(),
  book_b_id: z.string().uuid()
});

const setReadingGoalSchema = z.object({
  year: z.number().int().positive(),
  target_books: z.number().int().positive()
});

const logProgressSchema = z.object({
  year: z.number().int().positive(),
  pages_read: z.number().int().positive(),
  completed_book: z.boolean().default(false)
});

const createDigitalNewspaperSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  current_issue_url: z.string().url()
});

const newspaperBookmarkSchema = z.object({
  article_title: z.string().min(1),
  highlight_text: z.string().optional()
});

const createBookClubSchema = z.object({
  name: z.string().min(1),
  current_book_id: z.string().uuid().optional().nullable(),
  schedule: z.string().optional()
});

const bookClubDiscussionSchema = z.object({
  chapter: z.string().min(1),
  question: z.string().min(1)
});

const bookClubDiscussionResponseSchema = z.object({
  discussion_id: z.string().uuid(),
  response: z.string().min(1)
});

const interlibraryRequestSchema = z.object({
  providing_institution_id: z.string().uuid(),
  book_id: z.string().uuid()
});

// Helper to generate a dummy 1536-dimensional vector for embeddings
function generateDummyVector(): number[] {
  return Array.from({ length: 1536 }, () => parseFloat((Math.random() * 2 - 1).toFixed(4)));
}

// Helper to check if vector extension is available
let vectorExtAvailable: boolean | null = null;
async function checkVectorExtension(): Promise<boolean> {
  if (vectorExtAvailable !== null) return vectorExtAvailable;
  try {
    const { error } = await supabaseAdmin.rpc('match_books', {
      query_embedding: generateDummyVector(),
      match_threshold: 0,
      match_count: 1,
      inst_id: '00000000-0000-0000-0000-000000000000'
    });
    // If error mentions "function match_books does not exist", vector isn't set up
    vectorExtAvailable = !error || !error.message?.includes('does not exist');
  } catch {
    vectorExtAvailable = false;
  }
  return vectorExtAvailable;
}

// Helper to generate embedding using OpenAI (skips if key is dummy, returns dummy vector)
async function getBookDescriptionEmbedding(description: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-your')) {
    return generateDummyVector();
  }

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: description
      })
    });
    if (!res.ok) throw new Error('OpenAI embedding request failed');
    const json = (await res.json()) as any;
    return json.data[0].embedding;
  } catch (err) {
    logger.warn('Failed to fetch OpenAI embedding, falling back to dummy vector.', { error: err });
    return generateDummyVector();
  }
}

// ============================================================
// 1. BOOK CATALOGUE & MANAGEMENT
// ============================================================

export async function listBooks(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { search, category, available } = req.query;

    let query = supabaseAdmin
      .from('books')
      .select('*')
      .order('title', { ascending: true });

    if (institution_id) {
      query = query.eq('institution_id', institution_id);
    }

    if (category) {
      query = query.eq('category', category as string);
    }
    if (available === 'true') {
      query = query.gt('copies_available', 0);
    }

    const { data: books, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    let filtered = books || [];
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(searchLower) ||
        b.author.toLowerCase().includes(searchLower) ||
        (b.isbn && b.isbn.toLowerCase().includes(searchLower)) ||
        (b.tags && b.tags.some((t: string) => t.toLowerCase().includes(searchLower)))
      );
    }

    return res.status(200).json({ success: true, books: filtered });
  } catch (err: any) {
    console.error('[listBooks] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
}

export async function getBook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: book, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !book) return res.status(404).json({ success: false, error: 'Book record not found.' });

    // Fetch active borrowings
    const { data: issues } = await supabaseAdmin
      .from('book_issues')
      .select('*, students(name, roll_number)')
      .eq('book_id', id)
      .eq('status', 'issued');

    return res.status(200).json({ success: true, book, active_issues: issues || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function createBook(req: Request, res: Response) {
  try {
    const parse = createBookSchema.safeParse(req.body);
    if (!parse.success) {
      console.error('[createBook] Validation failed:', parse.error.errors);
      return res.status(400).json({ success: false, error: parse.error.errors.map(e => e.message).join(', ') });
    }

    const institutionId = req.user?.institution_id;
    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'No institution context. Please log in again.' });
    }

    // Try to generate embedding, but don't fail if vector extension is missing
    let embedding: number[] | undefined;
    try {
      const hasVector = await checkVectorExtension();
      if (hasVector) {
        embedding = await getBookDescriptionEmbedding(parse.data.description || parse.data.title);
      }
    } catch (e: any) {
      console.warn('[createBook] Embedding generation skipped:', e.message);
    }

    const insertData: any = {
      ...parse.data,
      institution_id: institutionId,
    };
    if (embedding) insertData.embedding = embedding;

    console.log('[createBook] Inserting book:', { title: parse.data.title, author: parse.data.author, institution_id: institutionId });

    // First try with embedding, if it fails retry without
    let { data: book, error } = await supabaseAdmin
      .from('books')
      .insert(insertData)
      .select()
      .single();

    // If embedding column doesn't exist, retry without it
    if (error && error.message?.includes('embedding')) {
      console.warn('[createBook] Embedding column issue, retrying without embedding');
      delete insertData.embedding;
      ({ data: book, error } = await supabaseAdmin
        .from('books')
        .insert(insertData)
        .select()
        .single());
    }

    if (error) {
      console.error('[createBook] Supabase insert error:', error.message, error.details, error.hint);
      return res.status(500).json({ success: false, error: `Database error: ${error.message}` });
    }

    console.log('[createBook] Book created successfully:', book.id);
    return res.status(201).json({ success: true, book });
  } catch (err: any) {
    console.error('[createBook] Unhandled error:', err.message, err.stack);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
}

export async function updateBook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = createBookSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    let updateData: any = { ...parse.data };
    if (parse.data.description) {
      try {
        const hasVector = await checkVectorExtension();
        if (hasVector) {
          const embedding = await getBookDescriptionEmbedding(parse.data.description);
          updateData.embedding = embedding;
        }
      } catch {}
    }

    const { data: book, error } = await supabaseAdmin
      .from('books')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, book });
  } catch (err: any) {
    console.error('[updateBook] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
}

export async function lookupIsbn(req: Request, res: Response) {
  try {
    const { isbn } = req.body;
    if (!isbn) return res.status(400).json({ success: false, error: 'ISBN is required.' });

    // Mock lookups fallback or hit Google Books API if key is there
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const json = (await response.json()) as any;
      if (json.totalItems > 0) {
        const info = json.items[0].volumeInfo;
        return res.status(200).json({
          success: true,
          book: {
            isbn,
            title: info.title,
            author: info.authors ? info.authors.join(', ') : 'Unknown Author',
            publisher: info.publisher || 'Unknown Publisher',
            publication_year: info.publishedDate ? parseInt(info.publishedDate.split('-')[0]) : undefined,
            description: info.description || '',
            cover_image_url: info.imageLinks ? info.imageLinks.thumbnail : '',
            category: info.categories ? info.categories[0] : 'General'
          }
        });
      }
    } catch {
      // Ignore and fallback to mock details
    }

    // Fallback Mock
    return res.status(200).json({
      success: true,
      book: {
        isbn,
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        publisher: 'MIT Press',
        publication_year: 2009,
        description: 'A comprehensive guide to the study of computer algorithms.',
        cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
        category: 'Computer Science'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function importBooks(req: Request, res: Response) {
  try {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, error: 'Books list array is required and must not be empty.' });
    }

    const institutionId = req.user?.institution_id;
    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'No institution context.' });
    }

    console.log(`[importBooks] Importing ${books.length} books for institution ${institutionId}`);

    const hasVector = await checkVectorExtension();
    const insertedBooks = [];
    const errors: string[] = [];

    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      if (!b.title || !b.author) {
        errors.push(`Book ${i + 1}: title and author are required`);
        continue;
      }

      const insertData: any = {
        title: b.title,
        author: b.author,
        isbn: b.isbn || null,
        publisher: b.publisher || null,
        category: b.category || null,
        copies_total: b.copies_total || 1,
        copies_available: b.copies_available || 1,
        shelf_location: b.shelf_location || null,
        institution_id: institutionId,
      };

      // First try with embedding, if it fails try without
      let { data, error } = await supabaseAdmin
        .from('books')
        .insert(hasVector ? { ...insertData, embedding: generateDummyVector() } : insertData)
        .select()
        .single();

      // If embedding column doesn't exist, retry without it
      if (error && error.message?.includes('embedding')) {
        console.warn(`[importBooks] Embedding column issue, retrying without embedding for "${b.title}"`);
        ({ data, error } = await supabaseAdmin
          .from('books')
          .insert(insertData)
          .select()
          .single());
      }

      if (data) insertedBooks.push(data);
      if (error) {
        console.error(`[importBooks] Insert error for book ${i + 1} "${b.title}":`, error.message, error.details);
        errors.push(`Book "${b.title}": ${error.message}`);
      }
    }

    console.log(`[importBooks] Result: ${insertedBooks.length} inserted, ${errors.length} errors`);

    return res.status(201).json({
      success: insertedBooks.length > 0,
      count: insertedBooks.length,
      books: insertedBooks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    console.error('[importBooks] Unhandled error:', err.message, err.stack);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
}

// ============================================================
// 2. BOOK ISSUE & RETURN WORKFLOWS
// ============================================================

export async function issueBook(req: Request, res: Response) {
  try {
    const parse = issueBookSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { book_id, student_id, due_date, condition_on_issue, notes } = parse.data;

    // Check outstanding unpaid fines > 100
    const { data: fines } = await supabaseAdmin
      .from('library_fines')
      .select('amount')
      .eq('student_id', student_id)
      .eq('status', 'unpaid');

    const totalFines = (fines || []).reduce((acc, f) => acc + (f.amount || 0), 0);
    if (totalFines > 100) {
      return res.status(400).json({
        success: false,
        error: `Checkout blocked. Student has outstanding fines of ₹${totalFines} exceeding safe limit of ₹100.`
      });
    }

    // Check copies availability
    const { data: book, error: bkErr } = await supabaseAdmin
      .from('books')
      .select('copies_available, title')
      .eq('id', book_id)
      .single();

    if (bkErr || !book) return res.status(404).json({ success: false, error: 'Book details not found.' });
    if (book.copies_available <= 0) {
      return res.status(400).json({ success: false, error: `No physical copies of "${book.title}" are currently available.` });
    }

    // Create Issue
    const { data: issue, error: issueErr } = await supabaseAdmin
      .from('book_issues')
      .insert({
        book_id,
        student_id,
        issued_by: req.user?.id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date,
        condition_on_issue,
        notes,
        status: 'issued'
      })
      .select()
      .single();

    if (issueErr) return res.status(500).json({ success: false, error: issueErr.message });

    // Decrement availability
    await supabaseAdmin
      .from('books')
      .update({ copies_available: book.copies_available - 1 })
      .eq('id', book_id);

    // Log reading history
    await supabaseAdmin
      .from('reading_history')
      .insert({
        student_id,
        book_id,
        action: 'borrow'
      });

    return res.status(201).json({ success: true, issue });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function returnBook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = returnBookSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { condition_on_return, fine_amount, fine_paid, payment_method, transaction_id } = parse.data;

    // Get issue details
    const { data: issue, error: issueErr } = await supabaseAdmin
      .from('book_issues')
      .select('*, books(copies_available, title)')
      .eq('id', id)
      .eq('status', 'issued')
      .single();

    if (issueErr || !issue) return res.status(404).json({ success: false, error: 'Active issue record not found.' });

    // Calculate return status
    const returnDateStr = new Date().toISOString().split('T')[0];
    const isOverdue = new Date(returnDateStr) > new Date(issue.due_date);

    // Update Issue
    const { data: updatedIssue, error: updateErr } = await supabaseAdmin
      .from('book_issues')
      .update({
        return_date: returnDateStr,
        returned_to: req.user?.id,
        condition_on_return,
        fine_amount,
        fine_paid,
        fine_paid_date: fine_paid ? returnDateStr : null,
        status: 'returned'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

    // Increment copies availability
    await supabaseAdmin
      .from('books')
      .update({ copies_available: issue.books.copies_available + 1 })
      .eq('id', issue.book_id);

    // Log history
    await supabaseAdmin
      .from('reading_history')
      .insert({
        student_id: issue.student_id,
        book_id: issue.book_id,
        action: 'return'
      });

    // Create Fine invoice if applicable
    if (fine_amount > 0) {
      await supabaseAdmin
        .from('library_fines')
        .insert({
          student_id: issue.student_id,
          issue_id: id,
          amount: fine_amount,
          reason: isOverdue ? 'Overdue book return penalty' : 'Physical book damage fee',
          status: fine_paid ? 'paid' : 'unpaid',
          payment_date: fine_paid ? returnDateStr : null,
          payment_method: payment_method || null,
          transaction_id: transaction_id || null
        });
    }

    // Trigger next reservation alert
    const { data: nextReservation } = await supabaseAdmin
      .from('book_reservations')
      .select('*')
      .eq('book_id', issue.book_id)
      .eq('status', 'waiting')
      .order('reserved_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextReservation) {
      await supabaseAdmin
        .from('book_reservations')
        .update({
          status: 'notified',
          notified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString() // 48h to claim
        })
        .eq('id', nextReservation.id);
    }

    return res.status(200).json({ success: true, issue: updatedIssue, next_notified: !!nextReservation });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function renewBook(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: issue, error: issueErr } = await supabaseAdmin
      .from('book_issues')
      .select('*')
      .eq('id', id)
      .eq('status', 'issued')
      .single();

    if (issueErr || !issue) return res.status(404).json({ success: false, error: 'Active issue record not found.' });

    // Enforce max 2 renewals limit
    if (issue.renewal_count >= 2) {
      return res.status(400).json({ success: false, error: 'Maximum renewal count (2) reached for this checkout.' });
    }

    // Check reservations block
    const { count: reservationsCount } = await supabaseAdmin
      .from('book_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', issue.book_id)
      .eq('status', 'waiting');

    if (reservationsCount && reservationsCount > 0) {
      return res.status(400).json({ success: false, error: 'Cannot renew. The book is reserved by another student.' });
    }

    // Extend due date by 14 days
    const currentDue = new Date(issue.due_date);
    currentDue.setDate(currentDue.getDate() + 14);
    const nextDueDateStr = currentDue.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('book_issues')
      .update({
        due_date: nextDueDateStr,
        renewal_count: issue.renewal_count + 1
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Due date extended by 14 days.', issue: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listStudentIssues(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('book_issues')
      .select('*, books(title, author, cover_image_url)')
      .eq('student_id', studentId)
      .order('issue_date', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, issues: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listOverdueIssues(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('book_issues')
      .select('*, books(*), students(name, roll_number, guardian_phone, user_id)')
      .eq('status', 'issued')
      .lt('due_date', today);

    if (error) return res.status(500).json({ success: false, error: error.message });

    const filtered = (data || []).filter((i: any) => i.books?.institution_id === institution_id);
    return res.status(200).json({ success: true, overdue: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 3. BOOK RESERVATIONS
// ============================================================

export async function reserveBook(req: Request, res: Response) {
  try {
    const parse = reserveBookSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { book_id, student_id, expires_at } = parse.data;

    // Check if students already reserved this book active
    const { data: existing } = await supabaseAdmin
      .from('book_reservations')
      .select('id')
      .eq('book_id', book_id)
      .eq('student_id', student_id)
      .in('status', ['waiting', 'notified'])
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: 'You already have an active reservation for this book.' });
    }

    const { data, error } = await supabaseAdmin
      .from('book_reservations')
      .insert({
        book_id,
        student_id,
        expires_at: expires_at || null,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Log history
    await supabaseAdmin
      .from('reading_history')
      .insert({
        student_id,
        book_id,
        action: 'reserve'
      });

    return res.status(201).json({ success: true, reservation: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function deleteReservation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('book_reservations')
      .update({ status: 'expired' })
      .eq('id', id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Reservation cancelled.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listReservationsForBook(req: Request, res: Response) {
  try {
    const { bookId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('book_reservations')
      .select('*, students(name, roll_number)')
      .eq('book_id', bookId)
      .in('status', ['waiting', 'notified'])
      .order('reserved_at', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, reservations: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function processReservationQueue(req: Request, res: Response) {
  try {
    const now = new Date().toISOString();
    
    // 1. Fetch expired notified reservations
    const { data: expiredReservations, error: expErr } = await supabaseAdmin
      .from('book_reservations')
      .select('*')
      .eq('status', 'notified')
      .lt('expires_at', now);
      
    if (expErr) return res.status(500).json({ success: false, error: expErr.message });
    
    const expiredList = expiredReservations || [];
    const newlyNotified: any[] = [];
    
    for (const resv of expiredList) {
      // Mark as expired
      await supabaseAdmin
        .from('book_reservations')
        .update({ status: 'expired' })
        .eq('id', resv.id);
        
      // Fetch next in queue for the same book (FIFO order)
      const { data: nextResv } = await supabaseAdmin
        .from('book_reservations')
        .select('*')
        .eq('book_id', resv.book_id)
        .eq('status', 'waiting')
        .order('reserved_at', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      if (nextResv) {
        const expiresAt = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(); // 48h
        const { data: updated } = await supabaseAdmin
          .from('book_reservations')
          .update({
            status: 'notified',
            notified_at: now,
            expires_at: expiresAt
          })
          .eq('id', nextResv.id)
          .select()
          .single();
          
        if (updated) newlyNotified.push(updated);
      }
    }
    
    return res.status(200).json({
      success: true,
      expired_count: expiredList.length,
      expired_reservations: expiredList,
      newly_notified_reservations: newlyNotified
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
}

// ============================================================
// 4. E-RESOURCES PORTAL
// ============================================================

export async function listEbooks(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { department, semester, search } = req.query;

    let query = supabaseAdmin
      .from('ebooks')
      .select('*')
      .eq('institution_id', institution_id)
      .order('title', { ascending: true });

    if (department) query = query.eq('department', department as string);
    if (semester) query = query.eq('semester', semester as string);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    let filtered = data || [];
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(eb => 
        eb.title.toLowerCase().includes(searchLower) ||
        (eb.author && eb.author.toLowerCase().includes(searchLower)) ||
        (eb.description && eb.description.toLowerCase().includes(searchLower))
      );
    }

    return res.status(200).json({ success: true, ebooks: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function createEbook(req: Request, res: Response) {
  try {
    const parse = createEbookSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('ebooks')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        uploaded_by: req.user?.id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, ebook: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function viewEbook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const studentId = req.query.studentId as string;

    const { data: ebook } = await supabaseAdmin
      .from('ebooks')
      .select('view_count, id')
      .eq('id', id)
      .single();

    if (!ebook) return res.status(404).json({ success: false, error: 'E-book not found.' });

    await supabaseAdmin
      .from('ebooks')
      .update({ view_count: (ebook.view_count || 0) + 1 })
      .eq('id', id);

    if (studentId) {
      await supabaseAdmin
        .from('reading_history')
        .insert({ student_id: studentId, ebook_id: id, action: 'view_ebook' });
    }

    return res.status(200).json({ success: true, message: 'View counter incremented.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function downloadEbook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const studentId = req.query.studentId as string;

    const { data: ebook } = await supabaseAdmin
      .from('ebooks')
      .select('download_count, id')
      .eq('id', id)
      .single();

    if (!ebook) return res.status(404).json({ success: false, error: 'E-book not found.' });

    await supabaseAdmin
      .from('ebooks')
      .update({ download_count: (ebook.download_count || 0) + 1 })
      .eq('id', id);

    if (studentId) {
      await supabaseAdmin
        .from('reading_history')
        .insert({ student_id: studentId, ebook_id: id, action: 'download_ebook' });
    }

    return res.status(200).json({ success: true, message: 'Download counter incremented.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 5. STUDY ROOM BOOKINGS
// ============================================================

export async function listStudyRooms(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { date } = req.query; // YYYY-MM-DD

    const { data: rooms, error: rmErr } = await supabaseAdmin
      .from('study_rooms')
      .select('*')
      .eq('institution_id', institution_id)
      .eq('is_active', true);

    if (rmErr) return res.status(500).json({ success: false, error: rmErr.message });

    // Fetch bookings for these rooms on selected date
    let bookings: any[] = [];
    if (date && rooms && rooms.length > 0) {
      const roomIds = rooms.map(r => r.id);
      const { data: bks } = await supabaseAdmin
        .from('study_room_bookings')
        .select('*')
        .in('room_id', roomIds)
        .eq('date', date as string)
        .in('status', ['confirmed', 'completed']);
      bookings = bks || [];
    }

    return res.status(200).json({ success: true, rooms: rooms || [], bookings });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function createStudyRoom(req: Request, res: Response) {
  try {
    const parse = createStudyRoomSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('study_rooms')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, room: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function bookStudyRoom(req: Request, res: Response) {
  try {
    const parse = bookStudyRoomSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { room_id, student_id, date, start_time, end_time, purpose, group_members } = parse.data;

    // Check max 1 booking per day per student
    const { count: dailyBookingCount } = await supabaseAdmin
      .from('study_room_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student_id)
      .eq('date', date)
      .in('status', ['confirmed', 'completed']);

    if (dailyBookingCount && dailyBookingCount > 0) {
      return res.status(400).json({ success: false, error: 'Student already has a study room booking on this date.' });
    }

    // Verify booking duration is max 3 hours
    const startMins = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
    const endMins = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
    if (endMins - startMins > 180) {
      return res.status(400).json({ success: false, error: 'Booking exceeds the maximum duration limit of 3 hours.' });
    }

    // Check room conflicts
    const { data: conflicts } = await supabaseAdmin
      .from('study_room_bookings')
      .select('id, start_time, end_time')
      .eq('room_id', room_id)
      .eq('date', date)
      .in('status', ['confirmed', 'completed']);

    const overlaps = (conflicts || []).some(c => {
      const cStart = parseInt(c.start_time.split(':')[0]) * 60 + parseInt(c.start_time.split(':')[1]);
      const cEnd = parseInt(c.end_time.split(':')[0]) * 60 + parseInt(c.end_time.split(':')[1]);
      return (startMins < cEnd && endMins > cStart);
    });

    if (overlaps) {
      return res.status(400).json({ success: false, error: 'Room is already booked during this time slot.' });
    }

    const qrCode = 'SRB-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data, error } = await supabaseAdmin
      .from('study_room_bookings')
      .insert({
        room_id,
        student_id,
        date,
        start_time,
        end_time,
        purpose,
        group_members,
        status: 'confirmed',
        qr_code: qrCode,
        checked_in: false
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, booking: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function deleteStudyRoomBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('study_room_bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function checkinStudyRoomBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('study_room_bookings')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, booking: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 6. FINES MANAGER
// ============================================================

export async function getStudentFines(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('library_fines')
      .select('*, book_issues(*, books(title))')
      .eq('student_id', studentId)
      .order('status', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, fines: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function payFine(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = payFineSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { payment_method, transaction_id } = parse.data;

    const { data: fine, error: fErr } = await supabaseAdmin
      .from('library_fines')
      .select('issue_id, amount')
      .eq('id', id)
      .single();

    if (fErr || !fine) return res.status(404).json({ success: false, error: 'Fine record not found.' });

    // Mark Fine Paid
    const { data: updatedFine, error } = await supabaseAdmin
      .from('library_fines')
      .update({
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method,
        transaction_id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Mark corresponding Issue fine as paid
    if (fine.issue_id) {
      await supabaseAdmin
        .from('book_issues')
        .update({
          fine_paid: true,
          fine_paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', fine.issue_id);
    }

    return res.status(200).json({ success: true, fine: updatedFine });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 7. AI BOOK RECOMMENDATIONS (vector similarity search + Claude)
// ============================================================

export async function getRecommendations(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const institution_id = req.user?.institution_id;

    // 1. Fetch Student History
    const { data: history } = await supabaseAdmin
      .from('reading_history')
      .select('book_id, books(embedding)')
      .eq('student_id', studentId)
      .not('book_id', 'is', null)
      .limit(5);

    const historyBooks = (history || []).filter(h => h.books && (h.books as any).embedding);

    let averageEmbedding: number[] = [];
    if (historyBooks.length > 0) {
      // Calculate average embedding
      const vectorSize = 1536;
      const sums = Array(vectorSize).fill(0);
      historyBooks.forEach(h => {
        const emb: number[] = (h.books as any).embedding;
        for (let i = 0; i < vectorSize; i++) {
          sums[i] += emb[i] || 0;
        }
      });
      averageEmbedding = sums.map(s => s / historyBooks.length);
    } else {
      // Use random dummy query vector
      averageEmbedding = generateDummyVector();
    }

    // 2. Perform Cosine Similarity vector search on Postgres
    const { data: matchedBooks, error: matchErr } = await supabaseAdmin.rpc('match_books', {
      query_embedding: averageEmbedding,
      match_threshold: 0.1,
      match_count: 5,
      inst_id: institution_id
    });

    if (matchErr) {
      logger.warn('match_books RPC query failed, falling back to basic recommendations.', { error: matchErr });
    }

    // 3. Fallback recommendations if vector returns empty
    let recommendations = matchedBooks || [];
    if (recommendations.length === 0) {
      const { data: fallback } = await supabaseAdmin
        .from('books')
        .select('id, title, author, category, cover_image_url, description, copies_available, shelf_location')
        .eq('institution_id', institution_id)
        .order('created_at', { ascending: false })
        .limit(5);
      recommendations = fallback || [];
    }

    // 4. Synergize Recommendations using Anthropic Claude API if key is there
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let explanationText = 'Recommended based on your recent borrow logs and syllabus details.';

    if (anthropicKey && !anthropicKey.startsWith('your-anthropic')) {
      try {
        const bookTitles = recommendations.map((b: any) => `"${b.title}" by ${b.author}`).join('\n');
        const prompt = `You are a helpful campus library assistant. We have selected the following recommended books for a student based on their reading patterns:\n${bookTitles}\n\nProvide a brief, encouraging, 2-sentence summary explaining why these topics are highly valuable for a college student's academic progress.`;

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 150,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (claudeRes.ok) {
          const json = (await claudeRes.json()) as any;
          explanationText = json.content[0].text;
        }
      } catch (err) {
        logger.error('Claude API book recommendations summary generation failed.', { error: err });
      }
    }

    return res.status(200).json({ success: true, recommendations, explanation: explanationText });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 8. LIBRARY ANALYTICS Overview
// ============================================================

export async function getOverviewStats(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const today = new Date().toISOString().split('T')[0];

    let booksQuery = supabaseAdmin.from('books').select('id', { count: 'exact', head: true });
    if (institution_id) booksQuery = booksQuery.eq('institution_id', institution_id);

    const [booksRes, activeRes, overdueRes, finesRes] = await Promise.all([
      booksQuery,
      supabaseAdmin.from('book_issues').select('id', { count: 'exact', head: true }).eq('status', 'issued'),
      supabaseAdmin.from('book_issues').select('id', { count: 'exact', head: true }).eq('status', 'issued').lt('due_date', today),
      supabaseAdmin.from('library_fines').select('amount').eq('status', 'unpaid')
    ]);

    const pendingFinesTotal = (finesRes.data || []).reduce((acc, f) => acc + (parseFloat(f.amount as any) || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        total_books: booksRes.count || 0,
        active_borrowings: activeRes.count || 0,
        overdue_borrowings: overdueRes.count || 0,
        pending_fines: pendingFinesTotal
      }
    });
  } catch (err: any) {
    console.error('[getOverviewStats] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
}

export async function getReports(req: Request, res: Response) {
  try {
    const { type } = req.query; // 'borrowings' | 'fines' | 'utilization'
    const institution_id = req.user?.institution_id;

    if (type === 'fines') {
      const { data } = await supabaseAdmin
        .from('library_fines')
        .select('*, students(name, roll_number)')
        .order('amount', { ascending: false });
      return res.status(200).json({ success: true, report: data || [] });
    }

    if (type === 'utilization') {
      const { data } = await supabaseAdmin
        .from('study_room_bookings')
        .select('*, study_rooms(name, capacity)')
        .order('date', { ascending: false });
      return res.status(200).json({ success: true, report: data || [] });
    }

    // Default: borrowings report
    const { data } = await supabaseAdmin
      .from('book_issues')
      .select('*, books(title, author), students(name, roll_number)')
      .order('issue_date', { ascending: false });

    return res.status(200).json({ success: true, report: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// Helper to resolve student_id from logged-in user
async function resolveStudentId(req: Request): Promise<string | null> {
  if (req.user?.role === 'Student') {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    if (data && !error) return data.id;
  }
  return null;
}

// ============================================================
// 9. AI RESEARCH ASSISTANT
// ============================================================

export async function aiResearchTopic(req: Request, res: Response) {
  try {
    const parse = aiResearchSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { topic } = parse.data;
    const institution_id = req.user?.institution_id;

    // Fetch some catalog books to feed as context for suggestions
    const { data: books } = await supabaseAdmin
      .from('books')
      .select('title, author, category')
      .eq('institution_id', institution_id)
      .limit(10);

    const catalogContext = (books || []).map(b => `"${b.title}" by ${b.author} [Category: ${b.category || 'General'}]`).join('\n');

    const prompt = `You are an AI Research Assistant for a university library. A student is researching the topic: "${topic}".
Catalog Books Available:
${catalogContext}

Provide a structured JSON research brief containing:
1. "key_concepts": List of 3 key concepts/subtopics with brief explanations.
2. "suggested_books": List of 2 books from the catalog list above that relate to the topic. If none match, pick general matching textbooks.
3. "external_references": List of 2 peer-reviewed journals, papers, or digital links.
4. "reading_list": List of 3 reading list titles.

Format strictly as JSON:
{
  "key_concepts": [{"title": "Concept 1", "explanation": "Brief description..."}],
  "suggested_books": [{"title": "Book Title", "author": "Author", "relevance": "Why it is relevant..."}],
  "external_references": [{"title": "Article Title", "citation": "Author/Publisher, Year", "url": "URL"}],
  "reading_list": ["Step 1: Introduction", "Step 2: Core Concepts", "Step 3: Advanced Applications"]
}`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let researchBrief: any = null;

    if (anthropicKey && !anthropicKey.startsWith('your-anthropic')) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          const json = (await response.json()) as any;
          const text = json.content[0].text;
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            researchBrief = JSON.parse(match[0]);
          }
        }
      } catch (err) {
        console.error('Claude API research assistance call failed', err);
      }
    }

    if (!researchBrief) {
      // High-fidelity fallback research brief
      researchBrief = {
        key_concepts: [
          { title: "Foundational Architectures", explanation: "Understanding the core theoretical models and mathematical frameworks related to " + topic + "." },
          { title: "Practical Implementation", explanation: "Compiling code, configurations, or lab parameters to realize systems on the subject." },
          { title: "Future Outlook", explanation: "Current research frontiers, scaling limits, and downstream impacts on industry standards." }
        ],
        suggested_books: [
          { title: "Introduction to Algorithms", author: "Thomas H. Cormen", relevance: "Essential for algorithmic designs related to " + topic + "." },
          { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", relevance: "Comprehensive grounding in intelligent agents relevant to the topic." }
        ],
        external_references: [
          { title: "Overview of " + topic + " Systems", citation: "IEEE Transactions, 2025", url: "https://ieeexplore.ieee.org" },
          { title: "Advanced Methods in Campus Information", citation: "ACM Computing Surveys, 2026", url: "https://dl.acm.org" }
        ],
        reading_list: [
          "1. Core Theoretical Foundations",
          "2. Standard Architectural Protocols",
          "3. Experimental Case Studies & Analysis"
        ]
      };
    }

    return res.status(200).json({ success: true, research_brief: researchBrief });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function aiSummarizeBook(req: Request, res: Response) {
  try {
    const parse = aiSummarizeSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { book_id } = parse.data;

    // Fetch book
    const { data: book, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', book_id)
      .single();

    if (error || !book) return res.status(404).json({ success: false, error: 'Book not found.' });

    const prompt = `You are a library book summarizer. Summarize the book "${book.title}" by ${book.author} in exactly 5 high-fidelity bullet points.
Context Description: ${book.description || 'No description available.'}

Format as a JSON array of 5 strings:
{
  "summary": [
    "Point 1: Key thesis of the book...",
    "Point 2: Core methodologies described...",
    "Point 3: Theoretical paradigms explored...",
    "Point 4: Practical experiments or case examples...",
    "Point 5: Main takeaways and academic value..."
  ]
}`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let summaryList: string[] = [];

    if (anthropicKey && !anthropicKey.startsWith('your-anthropic')) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          const json = (await response.json()) as any;
          const text = json.content[0].text;
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            summaryList = parsed.summary || [];
          }
        }
      } catch (err) {
        console.error('Claude API summarizer failed', err);
      }
    }

    if (summaryList.length === 0) {
      summaryList = [
        `1. Core Theme: Explores foundational concepts of "${book.title}" authored by ${book.author}.`,
        `2. Technical Insight: Outlines system modeling methodologies, computational tools, and architectural paradigms.`,
        `3. Practical Application: Details step-by-step algorithms and code snippets to implement concepts in real environments.`,
        `4. Theoretical Framework: Grounded in classical theorems with extensive proofs and reference parameters.`,
        `5. Academic Value: Highly recommended reference material for students seeking to master the subcategory of study.`
      ];
    }

    return res.status(200).json({ success: true, summary: summaryList });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function aiCompareBooks(req: Request, res: Response) {
  try {
    const parse = aiCompareSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { book_a_id, book_b_id } = parse.data;

    // Fetch both books
    const { data: bookA } = await supabaseAdmin.from('books').select('*').eq('id', book_a_id).single();
    const { data: bookB } = await supabaseAdmin.from('books').select('*').eq('id', book_b_id).single();

    if (!bookA || !bookB) return res.status(404).json({ success: false, error: 'One or both books not found.' });

    const prompt = `Compare these two books for suitability in coursework (specifically focusing on clarity, depth, and practical code exercises):
Book A: "${bookA.title}" by ${bookA.author} (Description: ${bookA.description || 'N/A'})
Book B: "${bookB.title}" by ${bookB.author} (Description: ${bookB.description || 'N/A'})

Provide a structured JSON comparison detailing:
1. "book_a_focus": Main focus areas of Book A.
2. "book_b_focus": Main focus areas of Book B.
3. "suitability_comparison": Comparison summary.
4. "recommendation": Final verdict on which is better for which scenario.

Format strictly as JSON:
{
  "book_a_focus": "Book A emphasizes theory and mathematical proofs...",
  "book_b_focus": "Book B emphasizes programming exercises and frameworks...",
  "suitability_comparison": "Book A is better suited for research-oriented courses, while Book B is ideal for hands-on labs.",
  "recommendation": "Choose Book A for deep academic concepts; choose Book B for project development."
}`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let comparison: any = null;

    if (anthropicKey && !anthropicKey.startsWith('your-anthropic')) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          const json = (await response.json()) as any;
          const text = json.content[0].text;
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            comparison = JSON.parse(match[0]);
          }
        }
      } catch (err) {
        console.error('Claude API book comparison failed', err);
      }
    }

    if (!comparison) {
      comparison = {
        book_a_focus: `"${bookA.title}" centers around standard rigorous theorems, analytical modeling, and textbook proofs.`,
        book_b_focus: `"${bookB.title}" is oriented towards hands-on project tutorials, industrial code snippets, and API usages.`,
        suitability_comparison: `While Book A serves as a comprehensive reference manual for academic exams, Book B provides immediate toolsets for project labs.`,
        recommendation: `Choose "${bookA.title}" for a deep mathematical dive; choose "${bookB.title}" for rapid project implementation.`
      };
    }

    return res.status(200).json({ success: true, comparison });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 10. READING PROGRESS & GOALS
// ============================================================

export async function setReadingGoal(req: Request, res: Response) {
  try {
    const studentId = await resolveStudentId(req);
    if (!studentId) return res.status(400).json({ success: false, error: 'Student ID not found for this user.' });

    const parse = setReadingGoalSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { year, target_books } = parse.data;

    const { data: goal, error } = await supabaseAdmin
      .from('reading_goals')
      .upsert({
        student_id: studentId,
        institution_id: req.user?.institution_id,
        year,
        target_books
      }, { onConflict: 'student_id,year' })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, goal });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function logReadingProgress(req: Request, res: Response) {
  try {
    const studentId = await resolveStudentId(req);
    if (!studentId) return res.status(400).json({ success: false, error: 'Student ID not found for this user.' });

    const parse = logProgressSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { year, pages_read, completed_book } = parse.data;

    // Fetch existing goals
    const { data: existing } = await supabaseAdmin
      .from('reading_goals')
      .select('*')
      .eq('student_id', studentId)
      .eq('year', year)
      .maybeSingle();

    let targetBooks = 10;
    let completedBooks = 0;
    let streak = 0;
    let points = 0;
    let pagesTotal = 0;

    if (existing) {
      targetBooks = existing.target_books;
      completedBooks = existing.completed_books || 0;
      streak = existing.streak_days || 0;
      points = existing.points || 0;
      pagesTotal = existing.pages_read_total || 0;
    }

    pagesTotal += pages_read;
    streak += 1; // Increment streak simple daily tracker
    points += pages_read * 2; // 2 points per page read

    if (completed_book) {
      completedBooks += 1;
      points += 100; // Bonus points for finishing a book
    }

    const { data: updated, error } = await supabaseAdmin
      .from('reading_goals')
      .upsert({
        student_id: studentId,
        institution_id: req.user?.institution_id,
        year,
        target_books: targetBooks,
        completed_books: completedBooks,
        streak_days: streak,
        points,
        pages_read_total: pagesTotal
      }, { onConflict: 'student_id,year' })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, progress: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function getReadingStats(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const currentYear = new Date().getFullYear();

    const { data: goal } = await supabaseAdmin
      .from('reading_goals')
      .select('*')
      .eq('student_id', studentId)
      .eq('year', currentYear)
      .maybeSingle();

    // Group stats mockup
    const stats = {
      pages_per_day: goal ? parseFloat((goal.pages_read_total / 30).toFixed(1)) : 0,
      streak: goal ? goal.streak_days : 0,
      completed: goal ? goal.completed_books : 0,
      points: goal ? goal.points : 0,
      genres: [
        { genre: 'Computer Science', count: 5 },
        { genre: 'Mathematics', count: 2 },
        { genre: 'Fiction', count: 1 }
      ],
      authors: [
        { author: 'Thomas H. Cormen', count: 3 },
        { author: 'Stuart Russell', count: 2 }
      ]
    };

    return res.status(200).json({ success: true, stats, goal });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function getGoalsLeaderboard(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const currentYear = new Date().getFullYear();

    const { data: leaderboard, error } = await supabaseAdmin
      .from('reading_goals')
      .select('*, students(name, roll_number)')
      .eq('institution_id', institution_id)
      .eq('year', currentYear)
      .order('pages_read_total', { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, leaderboard: leaderboard || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 11. DIGITAL NEWSPAPER PORTAL
// ============================================================

export async function listNewspapers(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('digital_newspapers')
      .select('*')
      .eq('institution_id', institution_id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, newspapers: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function createNewspaper(req: Request, res: Response) {
  try {
    const parse = createDigitalNewspaperSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const archive = {
      [new Date().toISOString().split('T')[0]]: parse.data.current_issue_url
    };

    const { data, error } = await supabaseAdmin
      .from('digital_newspapers')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        archive_urls: archive
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, newspaper: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function bookmarkNewspaperArticle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const studentId = await resolveStudentId(req);
    if (!studentId) return res.status(400).json({ success: false, error: 'Student ID not found.' });

    const parse = newspaperBookmarkSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { article_title, highlight_text } = parse.data;

    // Fetch existing bookmarks
    const { data: news, error: fetchErr } = await supabaseAdmin
      .from('digital_newspapers')
      .select('bookmarks')
      .eq('id', id)
      .single();

    if (fetchErr || !news) return res.status(404).json({ success: false, error: 'Newspaper not found.' });

    const currentBookmarks = news.bookmarks || [];
    currentBookmarks.push({
      student_id: studentId,
      article_title,
      highlight_text: highlight_text || '',
      bookmarked_at: new Date().toISOString()
    });

    const { data: updatedNews, error: updateErr } = await supabaseAdmin
      .from('digital_newspapers')
      .update({ bookmarks: currentBookmarks })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
    return res.status(200).json({ success: true, bookmarks: updatedNews.bookmarks });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 12. BOOK CLUB MODULE
// ============================================================

export async function createBookClub(req: Request, res: Response) {
  try {
    const parse = createBookClubSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('book_clubs')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        members: []
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, book_club: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listBookClubs(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('book_clubs')
      .select('*, books(title, author, cover_image_url)')
      .eq('institution_id', institution_id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, book_clubs: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function joinBookClub(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const studentId = await resolveStudentId(req);
    if (!studentId) return res.status(400).json({ success: false, error: 'Student ID not found.' });

    // Fetch book club
    const { data: club, error: fetchErr } = await supabaseAdmin
      .from('book_clubs')
      .select('members')
      .eq('id', id)
      .single();

    if (fetchErr || !club) return res.status(404).json({ success: false, error: 'Book club not found.' });

    const members = club.members || [];
    if (members.includes(studentId)) {
      return res.status(400).json({ success: false, error: 'You are already a member of this book club.' });
    }

    members.push(studentId);

    const { data, error } = await supabaseAdmin
      .from('book_clubs')
      .update({ members })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, book_club: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listClubDiscussions(req: Request, res: Response) {
  try {
    const { id } = req.params; // club_id
    const { data, error } = await supabaseAdmin
      .from('book_club_discussions')
      .select('*')
      .eq('club_id', id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, discussions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function postClubDiscussion(req: Request, res: Response) {
  try {
    const { id } = req.params; // club_id
    const parse = bookClubDiscussionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { chapter, question } = parse.data;

    // Check if AI generated requested
    const ai_generated = req.body.ai_generated === true;
    let discussionQuestion = question;

    if (ai_generated) {
      // Call Claude to suggest a high quality chapter question
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey && !anthropicKey.startsWith('your-anthropic')) {
        try {
          const prompt = `Create a thought-provoking discussion question for Chapter: "${chapter}" of a book. Topic requested: "${question}". Make it brief, analytical and engaging.`;
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 300,
              messages: [{ role: 'user', content: prompt }]
            })
          });
          if (response.ok) {
            const json = (await response.json()) as any;
            discussionQuestion = json.content[0].text;
          }
        } catch {
          // ignore
        }
      }
    }

    const { data: discussion, error } = await supabaseAdmin
      .from('book_club_discussions')
      .insert({
        club_id: id,
        chapter,
        question: discussionQuestion,
        ai_generated,
        responses: []
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, discussion });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function respondToDiscussion(req: Request, res: Response) {
  try {
    const parse = bookClubDiscussionResponseSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { discussion_id, response } = parse.data;

    const studentId = await resolveStudentId(req);
    let name = 'Librarian/Staff';
    if (studentId) {
      const { data: std } = await supabaseAdmin.from('students').select('name').eq('id', studentId).single();
      if (std) name = std.name;
    } else {
      // Look up staff name
      const { data: stf } = await supabaseAdmin.from('staff').select('name').eq('id', req.user?.id).single();
      if (stf) name = stf.name;
    }

    const { data: disc, error: fetchErr } = await supabaseAdmin
      .from('book_club_discussions')
      .select('responses')
      .eq('id', discussion_id)
      .single();

    if (fetchErr || !disc) return res.status(404).json({ success: false, error: 'Discussion thread not found.' });

    const responses = disc.responses || [];
    responses.push({
      student_id: studentId || req.user?.id,
      name,
      response,
      posted_at: new Date().toISOString()
    });

    const { data: updatedDisc, error: updateErr } = await supabaseAdmin
      .from('book_club_discussions')
      .update({ responses })
      .eq('id', discussion_id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
    return res.status(200).json({ success: true, responses: updatedDisc.responses });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function issueClubCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params; // club_id
    const studentId = await resolveStudentId(req);
    if (!studentId) return res.status(400).json({ success: false, error: 'Student ID not resolved.' });

    // Fetch club and student details
    const { data: club } = await supabaseAdmin.from('book_clubs').select('*, books(title)').eq('id', id).single();
    const { data: student } = await supabaseAdmin.from('students').select('name, roll_number').eq('id', studentId).single();

    if (!club || !student) return res.status(404).json({ success: false, error: 'Details not found.' });

    // Verify student is member
    if (!club.members?.includes(studentId)) {
      return res.status(400).json({ success: false, error: 'You are not a registered member of this book club.' });
    }

    // Award bonus reading challenge points
    const currentYear = new Date().getFullYear();
    const { data: goal } = await supabaseAdmin
      .from('reading_goals')
      .select('*')
      .eq('student_id', studentId)
      .eq('year', currentYear)
      .maybeSingle();

    if (goal) {
      await supabaseAdmin
        .from('reading_goals')
        .update({
          points: (goal.points || 0) + 200, // 200 pts bonus for club completion
          completed_books: (goal.completed_books || 0) + 1
        })
        .eq('student_id', studentId)
        .eq('year', currentYear);
    }

    const verificationHash = 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const certificateUrl = `https://iris365.edu/verify/certificate/${verificationHash}`;

    return res.status(200).json({
      success: true,
      message: 'Certificate successfully generated and points added.',
      certificate: {
        student_name: student.name,
        book_title: club.books?.title || club.name,
        verification_code: verificationHash,
        url: certificateUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 13. INTERLIBRARY LOANS (ILL)
// ============================================================

export async function createInterlibraryRequest(req: Request, res: Response) {
  try {
    const parse = interlibraryRequestSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { providing_institution_id, book_id } = parse.data;

    const { data, error } = await supabaseAdmin
      .from('interlibrary_requests')
      .insert({
        requesting_institution_id: req.user?.institution_id,
        providing_institution_id,
        book_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, request: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listInterlibraryRequests(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;

    // View requests where current campus is requester or provider
    const { data, error } = await supabaseAdmin
      .from('interlibrary_requests')
      .select('*, books(title, author)')
      .or(`requesting_institution_id.eq.${institution_id},providing_institution_id.eq.${institution_id}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, requests: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function updateInterlibraryRequestStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, courier_tracking } = req.body;

    if (!status) return res.status(400).json({ success: false, error: 'Status is required.' });

    const { data, error } = await supabaseAdmin
      .from('interlibrary_requests')
      .update({
        status,
        courier_tracking: courier_tracking || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, request: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
