// backend/models/Question.js
import { pool } from "../config/db.js";
import { Option } from "./Option.js";

export class Question {
  static allowedTypes = ["mcq", "subjective"];
  static allowedStatuses = ['draft', 'submitted', 'under_review', 'change_requested', 'approved'];

  // Get all questions by course code
  static async getByCourseCode(courseCode) {
    const query = `
      SELECT q.*, 
             c.code as course_code,
             c.title as course_title,
             co.co_number,
             co.description as co_description,
             p.title as paper_title,
             u.name as author_name
      FROM questions q
      JOIN courses c ON q.course_id = c.course_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      LEFT JOIN question_papers p ON q.paper_id = p.paper_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE c.code = $1 AND q.is_active = true
      ORDER BY q.created_at DESC;
    `;
    const { rows } = await pool.query(query, [courseCode]);
    return rows;
  }

  // Get all questions by course code and question paper
  static async getByCourseCodeAndPaper(courseCode, paperId) {
    const query = `
      SELECT q.*, 
             c.code as course_code,
             c.title as course_title,
             co.co_number,
             co.description as co_description,
             p.title as paper_title,
             u.name as author_name
      FROM questions q
      JOIN courses c ON q.course_id = c.course_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      JOIN question_papers p ON q.paper_id = p.paper_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE c.code = $1 AND q.paper_id = $2 AND q.is_active = true
      ORDER BY q.created_at DESC;
    `;
    const { rows } = await pool.query(query, [courseCode, paperId]);
    return rows;
  }

  // Create subjective question
  static async createSubjective({ courseId, paperId, content, coId = null, createdBy }) {
    // Validate paper ownership
    await this.validatePaperOwnership(paperId, createdBy);

    const query = `
      INSERT INTO questions (course_id, paper_id, question_type, content, co_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING question_id, course_id, paper_id, question_type, content, co_id, status, is_active, created_at, updated_at;
    `;
    const values = [courseId, paperId, 'subjective', content, coId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Create objective (MCQ) question with options
  static async createObjective({ courseId, paperId, content, coId = null, options, createdBy }) {
  // Validate paper ownership (throws if invalid)
  await this.validatePaperOwnership(paperId, createdBy);

  // Validate options array
  if (!options || !Array.isArray(options) || options.length < 2) {
    throw new Error("At least 2 options are required for MCQ questions");
  }

  const correctCount = options.filter(opt => Option._toBoolean(opt.is_correct ?? opt.isCorrect ?? false)).length;
  if (correctCount === 0) {
    throw new Error("At least one correct option is required for MCQ questions");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert question
    const questionQuery = `
      INSERT INTO questions (course_id, paper_id, question_type, content, co_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING question_id;
    `;
    const questionValues = [courseId, paperId, "mcq", content, coId];
    const questionResult = await client.query(questionQuery, questionValues);
    const questionId = questionResult.rows[0].question_id;

    // Insert options (use the same client for atomicity)
    for (const opt of options) {
      const text = opt.option_text ?? opt.optionText ?? opt.text ?? "";
      Option._ensureNonEmptyString(text, "optionText");
      const isCorrect = Option._toBoolean(opt.is_correct ?? opt.isCorrect ?? false);

      const optionQuery = `
        INSERT INTO options (question_id, option_text, is_correct)
        VALUES ($1, $2, $3);
      `;
      await client.query(optionQuery, [questionId, text, isCorrect]);
    }

    await client.query("COMMIT");

    // Return complete question with options/media
    return await this.getById(questionId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

  // Update question
  static async update(questionId, updates, userId, userRole) {
  const { content, coId, question_type, options } = updates;

  // Basic validation
  if (question_type !== undefined && !this.allowedTypes.includes(question_type)) {
    throw new Error("Invalid question_type");
  }

  // Validate question exists
  const existingQuestion = await this.getById(questionId);
  if (!existingQuestion) {
    throw new Error("Question not found");
  }

  // Permission check (throws if not allowed)
  await this.validateQuestionOwnership(existingQuestion.paper_id, userId, userRole);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // If changing type: handle transitions
    const willChangeType = question_type !== undefined && question_type !== existingQuestion.question_type;

    // If changing SUBJECTIVE -> MCQ, require options
    if (willChangeType && existingQuestion.question_type !== "mcq" && question_type === "mcq") {
      if (!options || !Array.isArray(options) || options.length < 2) {
        throw new Error("Changing to 'mcq' requires at least 2 options");
      }
      if (options.filter(o => Option._toBoolean(o.is_correct)).length === 0) {
        throw new Error("At least one correct option is required for MCQ");
      }
    }

    // Update question basic fields if provided
    if (content !== undefined || coId !== undefined || question_type !== undefined) {
      const updateQuery = `
        UPDATE questions
        SET content = COALESCE($1, content),
            co_id = COALESCE($2, co_id),
            question_type = COALESCE($3, question_type),
            updated_at = CURRENT_TIMESTAMP
        WHERE question_id = $4
        RETURNING *;
      `;
      const updateValues = [content ?? null, coId ?? null, question_type ?? null, questionId];
      await client.query(updateQuery, updateValues);
    }

    // Handle options when type changes or options array provided
    // Cases:
    //  - existing mcq, updating options => replace options
    //  - changing to mcq (was subjective) => insert options (we already validated above)
    //  - changing from mcq to subjective => delete options
    if (willChangeType) {
      if (existingQuestion.question_type === "mcq" && question_type === "subjective") {
        // remove existing options (they no longer apply)
        await client.query("DELETE FROM options WHERE question_id = $1", [questionId]);
      }
      // if changed to mcq and options provided, we'll insert them below
    }

    // If options provided and resulting type should be mcq (either current or updated), replace them
    const resultingType = question_type ?? existingQuestion.question_type;
    if (options && Array.isArray(options) && resultingType === "mcq") {
      // remove existing options
      await client.query("DELETE FROM options WHERE question_id = $1", [questionId]);

      // insert new options
      for (const opt of options) {
        // accept both option_text and optionText keys
        const text = opt.option_text ?? opt.optionText ?? opt.text ?? "";
        Option._ensureNonEmptyString(text, "optionText");
        const isCorrect = Option._toBoolean(opt.is_correct ?? opt.isCorrect ?? false);
        const insertOptQuery = `
          INSERT INTO options (question_id, option_text, is_correct)
          VALUES ($1, $2, $3)
        `;
        await client.query(insertOptQuery, [questionId, text, isCorrect]);
      }
    }

    await client.query("COMMIT");
    return await this.getById(questionId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

  // Delete question (soft delete)
  static async delete(questionId, userId, userRole) {
    // Validate question exists and user has permission
    const existingQuestion = await this.getById(questionId);
    if (!existingQuestion) {
      throw new Error("Question not found");
    }

    await this.validateQuestionOwnership(existingQuestion.paper_id, userId, userRole);

    const query = `
      UPDATE questions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE question_id = $1 
      RETURNING question_id, is_active;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows[0];
  }

  // Get question by ID with complete details
  static async getById(questionId) {
    const query = `
      SELECT q.*, 
             c.code as course_code,
             c.title as course_title,
             co.co_number,
             co.description as co_description,
             p.title as paper_title,
             p.created_by as paper_author_id,
             u.name as author_name
      FROM questions q
LEFT JOIN courses c ON q.course_id = c.course_id
LEFT JOIN course_outcomes co ON q.co_id = co.co_id
LEFT JOIN question_papers p ON q.paper_id = p.paper_id
LEFT JOIN users u ON p.created_by = u.user_id
WHERE q.question_id = $1;
    `;
    const { rows } = await pool.query(query, [questionId]);
    
    if (rows.length === 0) return null;

    const question = rows[0];

    // Get options for MCQ questions
    if (question.question_type === 'mcq') {
      const optionsQuery = 'SELECT * FROM options WHERE question_id = $1 ORDER BY option_id';
      const optionsResult = await pool.query(optionsQuery, [questionId]);
      question.options = optionsResult.rows;
    }

    // Get media attachments
    const mediaQuery = 'SELECT * FROM question_media WHERE question_id = $1';
    const mediaResult = await pool.query(mediaQuery, [questionId]);
    question.media = mediaResult.rows;

    return question;
  }

  static async getByPaperId(paperId) {
  const query = `
    SELECT q.*, co.co_number
    FROM questions q
    LEFT JOIN course_outcomes co ON q.co_id = co.co_id
    WHERE q.paper_id = $1 AND q.is_active = true
    ORDER BY q.created_at DESC
  `;
  const { rows } = await pool.query(query, [paperId]);
  return rows;
}

  // Helper method to validate paper ownership
  static async validatePaperOwnership(paperId, userId) {
    const query = 'SELECT created_by FROM question_papers WHERE paper_id = $1';
    const { rows } = await pool.query(query, [paperId]);
    
    if (rows.length === 0) {
      throw new Error("Question paper not found");
    }
    
    if (rows[0].created_by !== userId) {
      throw new Error("You can only create questions for your own question papers");
    }
  }

  // Helper method to validate question ownership/admin access
  static async validateQuestionOwnership(paperId, userId, userRole) {
    if (userRole === 'admin') return true;

    const query = 'SELECT created_by FROM question_papers WHERE paper_id = $1';
    const { rows } = await pool.query(query, [paperId]);
    
    if (rows.length === 0) {
      throw new Error("Question paper not found");
    }
    
    if (rows[0].created_by !== userId) {
      throw new Error("You can only modify questions in your own question papers");
    }
  }
}