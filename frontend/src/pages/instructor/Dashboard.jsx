import React, { useEffect, useMemo, useState } from "react";
import questionPaperAPI from "../../api/questionPaper.api";
import courseAPI from "../../api/course.api";
import coAPI from "../../api/co.api";

/**
 * Instructor Dashboard (My Papers) — contains:
 * A. Status Overview Panel (KPIs)
 * C. My Pending Actions
 * D. Quick-Action Toolbar (Create, View All Papers, View Courses, View COs)
 *
 * Notes:
 * - No CSS included (structure-only).
 * - Links for the Quick-Action buttons are placeholders and can be passed as props or replaced later.
 * - Assumes APIs return either arrays or { rows, total } depending on backend.
 */

export default function InstructorDashboard({
  user,
  links = {
    createPaper: "#create-paper",
    viewAllPapers: "#papers",
    viewCourses: "#courses",
    viewCOs: "#cos",
  },
}) {
  const [papers, setPapers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [cosByCourse, setCosByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetch initial data: papers, courses, COs for courses the instructor has papers for
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        // Load papers (try to request only instructor's papers if supported)
        const resp = await questionPaperAPI.getAll({ limit: 200, offset: 0 });
        let fetchedPapers = [];
        if (Array.isArray(resp)) fetchedPapers = resp;
        else if (resp && resp.rows) fetchedPapers = resp.rows;

        // Filter to instructor's own papers if user info available
        const my = user?.user_id ? fetchedPapers.filter(p => p.created_by === user.user_id || p.creator_name === user.name) : fetchedPapers;

        // Load courses (we load all and later show shortcuts)
        const coursesResp = await courseAPI.getAll({ limit: 500 });
        let fetchedCourses = [];
        if (Array.isArray(coursesResp)) fetchedCourses = coursesResp;
        else if (coursesResp && coursesResp.rows) fetchedCourses = coursesResp.rows;

        // Preload COs for courses referenced in my papers
        const uniqueCourseCodes = Array.from(new Set(my.map(p => p.course_code).filter(Boolean)));
        const cosMap = {};
        for (const code of uniqueCourseCodes) {
          try {
            const cosResp = await coAPI.getByCourseCode(code);
            if (Array.isArray(cosResp)) cosMap[code] = cosResp;
            else cosMap[code] = cosResp?.rows ?? [];
          } catch (e) {
            cosMap[code] = [];
          }
        }

        if (!mounted) return;
        setPapers(my);
        setCourses(fetchedCourses);
        setCosByCourse(cosMap);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error("InstructorDashboard load error", err);
        setError(err?.message ?? String(err));
        setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [user]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totals = {
      drafts: 0,
      submitted: 0,
      under_review: 0,
      change_requested: 0,
      approved: 0,
      rejected: 0,
      total: papers.length,
    };

    for (const p of papers) {
      const st = (p.status || "draft").toLowerCase();
      if (st === "draft") totals.drafts++;
      else if (st === "submitted") totals.submitted++;
      else if (st === "under_review") totals.under_review++;
      else if (st === "change_requested") totals.change_requested++;
      else if (st === "approved") totals.approved++;
      else if (st === "rejected") totals.rejected++;
    }

    return totals;
  }, [papers]);

  // Pending actions derived client-side
  const pendingActions = useMemo(() => {
    const items = [];

    // 1. Papers with change_requested
    for (const p of papers.filter(x => (x.status || "").toLowerCase() === "change_requested")) {
      items.push({ type: "change_requested", paper: p, message: `Paper \"${p.title}\" requires your changes.` });
    }

    // 2. Drafts older than 7 days (use updated_at)
    const now = new Date();
    for (const p of papers.filter(x => (x.status || "").toLowerCase() === "draft")) {
      const updated = p.updated_at ? new Date(p.updated_at) : null;
      if (!updated) continue;
      const ageDays = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
      if (ageDays >= 7) {
        items.push({ type: "stale_draft", paper: p, message: `Draft \"${p.title}\" hasn't been edited in ${ageDays} days.` });
      }
    }

    // 3. Papers missing questions (question_count available or otherwise check 0)
    for (const p of papers) {
      const qCount = typeof p.question_count === 'number' ? p.question_count : p.questions_count || p.questions || (p._questions && p._questions.length) || 0;
      if (qCount === 0) items.push({ type: "no_questions", paper: p, message: `Paper \"${p.title}\" has no questions.` });
    }

    // 4. Papers missing CO coverage (compare course COs vs questions mapping if available)
    for (const p of papers) {
      const courseCode = p.course_code;
      const cos = cosByCourse[courseCode] || [];
      if (!cos || cos.length === 0) continue; // can't evaluate

      // try to compute covered CO numbers from questions if available
      const qList = p._questions || p.questions || [];
      // if questions not preloaded in paper object, skip coverage detection
      if (!Array.isArray(qList) || qList.length === 0) continue;

      const covered = new Set(qList.map(q => (q.co_number || q.co_number_raw || q.co || q.co_id || "").toString()).filter(Boolean));
      const missing = cos.filter(c => !covered.has(String(c.co_number)));
      if (missing.length > 0) items.push({ type: "missing_cos", paper: p, message: `Paper \"${p.title}\" is missing ${missing.length} CO(s).` });
    }

    return items;
  }, [papers, cosByCourse]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Failed to load dashboard: {error}</div>;

  return (
    <div>
      <h2>Instructor Dashboard — My Papers</h2>

      {/* Quick Action Toolbar (D) */}
      <section aria-label="quick-actions">
        <h3>Quick Actions</h3>
        <div>
          <a href={links.createPaper}>Create New Paper</a>
          {' | '}
          <a href={links.viewAllPapers}>View All Papers</a>
          {' | '}
          <a href={links.viewCourses}>View Courses</a>
          {' | '}
          <a href={links.viewCOs}>View COs</a>
        </div>
      </section>

      {/* Status Overview Panel (A) */}
      <section aria-label="status-overview">
        <h3>Status Overview</h3>
        <ul>
          <li>Drafts: {kpis.drafts}</li>
          <li>Submitted: {kpis.submitted}</li>
          <li>Under Review: {kpis.under_review}</li>
          <li>Change Requested: {kpis.change_requested}</li>
          <li>Approved: {kpis.approved}</li>
          <li>Rejected: {kpis.rejected}</li>
          <li>Total Papers: {kpis.total}</li>
        </ul>
      </section>

      {/* My Pending Actions (C) */}
      <section aria-label="pending-actions">
        <h3>Pending Actions</h3>
        {pendingActions.length === 0 ? (
          <div>No pending actions. Good job!</div>
        ) : (
          <ul>
            {pendingActions.map((it, idx) => (
              <li key={`${it.type}-${it.paper?.paper_id || idx}`}>
                <strong>[{it.type}]</strong> {it.message} {' '}
                {it.paper && <a href={`${links.viewAllPapers}#paper-${it.paper.paper_id}`}>Open</a>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Minimal list of papers for convenience */}
      <section aria-label="my-papers-list">
        <h3>My Papers (preview)</h3>
        {papers.length === 0 ? (
          <div>No papers found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Paper ID</th>
                <th>Title</th>
                <th>Course</th>
                <th>Status</th>
                <th>Version</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(p => (
                <tr key={p.paper_id}>
                  <td>{p.paper_id}</td>
                  <td>{p.title}</td>
                  <td>{p.course_code}</td>
                  <td>{p.status}</td>
                  <td>{p.version}</td>
                  <td>{p.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
