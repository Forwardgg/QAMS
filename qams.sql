--
-- PostgreSQL database dump
--

\restrict uuZBBdAf0FElWFLkRcDYZWBbaPcVLGILO0rQhkh9WJWp84RzoYsbd8v3BL6s7mk

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-04 20:38:56

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 241 (class 1255 OID 19888)
-- Name: update_courses_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_courses_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_courses_timestamp() OWNER TO postgres;

--
-- TOC entry 240 (class 1255 OID 17746)
-- Name: update_users_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_users_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_users_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 17557)
-- Name: course_outcomes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_outcomes (
    co_id integer NOT NULL,
    course_id integer,
    co_number character varying(10) NOT NULL,
    description text NOT NULL
);


ALTER TABLE public.course_outcomes OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 17536)
-- Name: course_outcomes_co_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_outcomes_co_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_outcomes_co_id_seq OWNER TO postgres;

--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 217
-- Name: course_outcomes_co_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_outcomes_co_id_seq OWNED BY public.course_outcomes.co_id;


--
-- TOC entry 229 (class 1259 OID 17548)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    course_id integer NOT NULL,
    code character varying(20) NOT NULL,
    title character varying(150) NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    l integer,
    t integer,
    p integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17537)
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_course_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_course_id_seq OWNER TO postgres;

--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 218
-- Name: courses_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_course_id_seq OWNED BY public.courses.course_id;


--
-- TOC entry 232 (class 1259 OID 17581)
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    details text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17538)
-- Name: logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 219
-- Name: logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_log_id_seq OWNED BY public.logs.log_id;


--
-- TOC entry 220 (class 1259 OID 17539)
-- Name: moderation_moderation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.moderation_moderation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moderation_moderation_id_seq OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17602)
-- Name: options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.options (
    option_id integer NOT NULL,
    question_id integer,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false
);


ALTER TABLE public.options OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17540)
-- Name: options_option_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.options_option_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.options_option_id_seq OWNER TO postgres;

--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 221
-- Name: options_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.options_option_id_seq OWNED BY public.options.option_id;


--
-- TOC entry 237 (class 1259 OID 17627)
-- Name: paper_moderation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_moderation (
    id integer NOT NULL,
    paper_id integer NOT NULL,
    moderator_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    comments text,
    reviewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT paper_moderation_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.paper_moderation OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17541)
-- Name: paper_moderation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paper_moderation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.paper_moderation_id_seq OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 222
-- Name: paper_moderation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.paper_moderation_id_seq OWNED BY public.paper_moderation.id;


--
-- TOC entry 236 (class 1259 OID 17621)
-- Name: paper_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_questions (
    id integer NOT NULL,
    paper_id integer,
    question_id integer,
    sequence integer NOT NULL,
    marks integer,
    section character varying(10)
);


ALTER TABLE public.paper_questions OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17542)
-- Name: paper_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paper_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.paper_questions_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 223
-- Name: paper_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.paper_questions_id_seq OWNED BY public.paper_questions.id;


--
-- TOC entry 239 (class 1259 OID 17649)
-- Name: question_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_media (
    id integer NOT NULL,
    question_id integer NOT NULL,
    media_url text NOT NULL,
    caption text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.question_media OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17543)
-- Name: question_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_media_id_seq OWNER TO postgres;

--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 224
-- Name: question_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_media_id_seq OWNED BY public.question_media.id;


--
-- TOC entry 238 (class 1259 OID 17638)
-- Name: question_moderation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_moderation (
    id integer NOT NULL,
    paper_id integer NOT NULL,
    question_id integer NOT NULL,
    moderator_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    comments text,
    reviewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT question_moderation_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.question_moderation OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17544)
-- Name: question_moderation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_moderation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_moderation_id_seq OWNER TO postgres;

--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 225
-- Name: question_moderation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_moderation_id_seq OWNED BY public.question_moderation.id;


--
-- TOC entry 235 (class 1259 OID 17611)
-- Name: question_papers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_papers (
    paper_id integer NOT NULL,
    course_id integer,
    instructor_id integer,
    title character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    version integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    exam_type character varying(50),
    semester character varying(20),
    academic_year character varying(20),
    full_marks integer,
    duration character varying(20)
);


ALTER TABLE public.question_papers OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17545)
-- Name: question_papers_paper_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_papers_paper_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_papers_paper_id_seq OWNER TO postgres;

--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 226
-- Name: question_papers_paper_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_papers_paper_id_seq OWNED BY public.question_papers.paper_id;


--
-- TOC entry 233 (class 1259 OID 17590)
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    question_id integer NOT NULL,
    course_id integer,
    author_id integer,
    question_type character varying(20) NOT NULL,
    content text NOT NULL,
    co_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    CONSTRAINT questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['mcq'::character varying, 'subjective'::character varying])::text[])))
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17546)
-- Name: questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_question_id_seq OWNER TO postgres;

--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 227
-- Name: questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_question_id_seq OWNED BY public.questions.question_id;


--
-- TOC entry 231 (class 1259 OID 17567)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'instructor'::character varying, 'moderator'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17547)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4798 (class 2604 OID 17560)
-- Name: course_outcomes co_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes ALTER COLUMN co_id SET DEFAULT nextval('public.course_outcomes_co_id_seq'::regclass);


--
-- TOC entry 4795 (class 2604 OID 17551)
-- Name: courses course_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN course_id SET DEFAULT nextval('public.courses_course_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 17584)
-- Name: logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs ALTER COLUMN log_id SET DEFAULT nextval('public.logs_log_id_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 17605)
-- Name: options option_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options ALTER COLUMN option_id SET DEFAULT nextval('public.options_option_id_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 17630)
-- Name: paper_moderation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation ALTER COLUMN id SET DEFAULT nextval('public.paper_moderation_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 17624)
-- Name: paper_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions ALTER COLUMN id SET DEFAULT nextval('public.paper_questions_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 17652)
-- Name: question_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_media ALTER COLUMN id SET DEFAULT nextval('public.question_media_id_seq'::regclass);


--
-- TOC entry 4820 (class 2604 OID 17641)
-- Name: question_moderation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation ALTER COLUMN id SET DEFAULT nextval('public.question_moderation_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 17614)
-- Name: question_papers paper_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers ALTER COLUMN paper_id SET DEFAULT nextval('public.question_papers_paper_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 17593)
-- Name: questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN question_id SET DEFAULT nextval('public.questions_question_id_seq'::regclass);


--
-- TOC entry 4799 (class 2604 OID 17570)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5038 (class 0 OID 17557)
-- Dependencies: 230
-- Data for Name: course_outcomes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_outcomes (co_id, course_id, co_number, description) FROM stdin;
1	1	CO1	Understand the fundamentals of relational databases
2	1	CO2	Apply SQL queries for data manipulation and retrieval
\.


--
-- TOC entry 5037 (class 0 OID 17548)
-- Dependencies: 229
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (course_id, code, title, created_by, created_at, l, t, p, updated_at) FROM stdin;
1	CS301	Database Management Systems	2	2025-10-01 17:09:12.776196	3	1	2	2025-10-04 16:23:39.290964
\.


--
-- TOC entry 5040 (class 0 OID 17581)
-- Dependencies: 232
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (log_id, user_id, action, details, created_at) FROM stdin;
1	1	REGISTER	instructor 1 registered	2025-10-01 16:33:20.280972
2	2	REGISTER	moderator 2 registered	2025-10-01 16:33:40.463481
3	5	REGISTER	instructor 5 registered	2025-10-02 14:46:19.3478
4	5	LOGIN	instructor 5 logged in	2025-10-02 14:49:15.303609
8	3	FAILED_LOGIN	Wrong password for email admin@example.com	2025-10-02 14:52:20.008674
9	3	FAILED_LOGIN	Wrong password for email admin@example.com	2025-10-02 14:53:15.807089
10	1	LOGIN	instructor 1 logged in	2025-10-02 14:53:58.136994
11	2	LOGIN	moderator 2 logged in	2025-10-02 14:54:02.497772
16	3	FAILED_LOGIN	Wrong password for email admin@example.com	2025-10-02 15:02:31.009259
17	3	LOGIN	admin 3 logged in	2025-10-02 15:15:48.444522
5	\N	FAILED_LOGIN	Wrong password for email rohit3@gmail.com	2025-10-02 14:51:10.617579
6	\N	FAILED_LOGIN	Wrong password for email rohit3@gmail.com	2025-10-02 14:51:23.229287
7	\N	FAILED_LOGIN	Wrong password for email rohit3@gmail.com	2025-10-02 14:51:41.667938
12	\N	FAILED_LOGIN	Wrong password for email rohit3@gmail.com	2025-10-02 14:54:06.423149
13	\N	FAILED_LOGIN	Wrong password for email rohit3@gmail.com	2025-10-02 14:54:13.350168
14	\N	FAILED_LOGIN	Wrong password for email newadmin@example.com	2025-10-02 15:00:58.322248
15	\N	FAILED_LOGIN	Wrong password for email newadmin@example.com	2025-10-02 15:01:06.284729
18	2	LOGIN	moderator 2 logged in	2025-10-02 15:17:48.531806
\.


--
-- TOC entry 5042 (class 0 OID 17602)
-- Dependencies: 234
-- Data for Name: options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.options (option_id, question_id, option_text, is_correct) FROM stdin;
1	1	SELECT * FROM table_name;	t
2	1	GET ALL FROM table_name;	f
3	1	FETCH ALL COLUMNS table_name;	f
4	1	SHOW * FROM table_name;	f
5	3	Entity	f
6	3	Relationship	t
7	3	Attribute	f
8	3	Cardinality	f
\.


--
-- TOC entry 5045 (class 0 OID 17627)
-- Dependencies: 237
-- Data for Name: paper_moderation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_moderation (id, paper_id, moderator_id, status, comments, reviewed_at) FROM stdin;
1	1	3	approved	Looks good	2025-10-01 17:10:00.798834
\.


--
-- TOC entry 5044 (class 0 OID 17621)
-- Dependencies: 236
-- Data for Name: paper_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_questions (id, paper_id, question_id, sequence, marks, section) FROM stdin;
1	1	1	1	5	A
2	1	2	2	10	A
3	1	3	3	5	B
\.


--
-- TOC entry 5047 (class 0 OID 17649)
-- Dependencies: 239
-- Data for Name: question_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_media (id, question_id, media_url, caption) FROM stdin;
1	3	https://dummyimage.com/600x400/000/fff.png&text=ER+Diagram	ER diagram image
\.


--
-- TOC entry 5046 (class 0 OID 17638)
-- Dependencies: 238
-- Data for Name: question_moderation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_moderation (id, paper_id, question_id, moderator_id, status, comments, reviewed_at) FROM stdin;
1	1	2	3	approved	Well framed	2025-10-01 17:10:07.136411
\.


--
-- TOC entry 5043 (class 0 OID 17611)
-- Dependencies: 235
-- Data for Name: question_papers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_papers (paper_id, course_id, instructor_id, title, status, version, created_at, updated_at, exam_type, semester, academic_year, full_marks, duration) FROM stdin;
1	1	2	Midterm Examination	under_review	1	2025-10-01 17:09:49.437409	2025-10-01 17:09:49.437409	Midterm	5	2025-26	50	2 hrs
\.


--
-- TOC entry 5041 (class 0 OID 17590)
-- Dependencies: 233
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (question_id, course_id, author_id, question_type, content, co_id, created_at, updated_at, is_active) FROM stdin;
1	1	2	mcq	Which of the following is a valid SQL statement to retrieve all columns?	2	2025-10-01 17:09:28.812213	2025-10-01 17:09:28.812213	t
2	1	2	subjective	Explain the concept of normalization in databases.	1	2025-10-01 17:09:28.812213	2025-10-01 17:09:28.812213	t
3	1	2	mcq	Identify the ER diagram component shown in the figure.	1	2025-10-01 17:09:28.812213	2025-10-01 17:09:28.812213	t
\.


--
-- TOC entry 5039 (class 0 OID 17567)
-- Dependencies: 231
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, password_hash, role, created_at, status, updated_at) FROM stdin;
1	Rohit 1	rohit1@gmail.com	$2b$10$cA8eqx4P16NX7DOcHyH7MeKxYO8cywQq20.poamq2ekjsuUUaApQe	instructor	2025-10-01 16:33:20.266293	active	2025-10-02 12:31:50.709245
2	Rohit 2	rohit2@gmail.com	$2b$10$k2YzaNKcvWaTNDET.xcsDOYG1otSf.FBo1PTMS5rqkQeAjZkaLux6	moderator	2025-10-01 16:33:40.459789	active	2025-10-02 12:31:50.709245
5	Suraj Sing	suraj@gmail.com	$2b$12$N1NpZmvv/2K92J36ktXTgOkTcl7AFhFKGmJk7VlSgiXR18ME.VUNS	instructor	2025-10-02 14:46:19.333103	active	2025-10-02 14:46:19.333103
3	Super Admin	admin@example.com	$2b$12$icU2NMCiA5aat21XyjYi5u8y3.wf89yB50ILfR4jnaMc9nR915A2e	admin	2025-10-01 16:42:16.084793	active	2025-10-02 15:14:47.441785
\.


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 217
-- Name: course_outcomes_co_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_outcomes_co_id_seq', 1, false);


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 218
-- Name: courses_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_course_id_seq', 1, false);


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 219
-- Name: logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_log_id_seq', 18, true);


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 220
-- Name: moderation_moderation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moderation_moderation_id_seq', 1, false);


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 221
-- Name: options_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.options_option_id_seq', 1, false);


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 222
-- Name: paper_moderation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paper_moderation_id_seq', 1, false);


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 223
-- Name: paper_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paper_questions_id_seq', 1, false);


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 224
-- Name: question_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_media_id_seq', 1, false);


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 225
-- Name: question_moderation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_moderation_id_seq', 1, false);


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 226
-- Name: question_papers_paper_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_papers_paper_id_seq', 1, false);


--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 227
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_question_id_seq', 1, false);


--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 8, true);


--
-- TOC entry 4835 (class 2606 OID 17566)
-- Name: course_outcomes course_outcomes_course_id_co_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_course_id_co_number_key UNIQUE (course_id, co_number);


--
-- TOC entry 4837 (class 2606 OID 17564)
-- Name: course_outcomes course_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_pkey PRIMARY KEY (co_id);


--
-- TOC entry 4831 (class 2606 OID 17556)
-- Name: courses courses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_key UNIQUE (code);


--
-- TOC entry 4833 (class 2606 OID 17554)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- TOC entry 4846 (class 2606 OID 17589)
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4850 (class 2606 OID 17610)
-- Name: options options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_pkey PRIMARY KEY (option_id);


--
-- TOC entry 4856 (class 2606 OID 17637)
-- Name: paper_moderation paper_moderation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation
    ADD CONSTRAINT paper_moderation_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 17626)
-- Name: paper_questions paper_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions
    ADD CONSTRAINT paper_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 17657)
-- Name: question_media question_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 17648)
-- Name: question_moderation question_moderation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 17620)
-- Name: question_papers question_papers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers
    ADD CONSTRAINT question_papers_pkey PRIMARY KEY (paper_id);


--
-- TOC entry 4848 (class 2606 OID 17601)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- TOC entry 4839 (class 2606 OID 18930)
-- Name: users unique_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_email UNIQUE (email);


--
-- TOC entry 4841 (class 2606 OID 17580)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4844 (class 2606 OID 17578)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4842 (class 1259 OID 17744)
-- Name: users_email_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_unique_idx ON public.users USING btree (lower((email)::text));


--
-- TOC entry 4878 (class 2620 OID 19889)
-- Name: courses trg_update_courses_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_courses_timestamp BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_courses_timestamp();


--
-- TOC entry 4879 (class 2620 OID 17747)
-- Name: users trg_update_users_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_users_timestamp();


--
-- TOC entry 4862 (class 2606 OID 17658)
-- Name: course_outcomes course_outcomes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 4861 (class 2606 OID 17758)
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4863 (class 2606 OID 18924)
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4867 (class 2606 OID 17673)
-- Name: options options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4872 (class 2606 OID 17678)
-- Name: paper_moderation paper_moderation_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation
    ADD CONSTRAINT paper_moderation_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4873 (class 2606 OID 17683)
-- Name: paper_moderation paper_moderation_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation
    ADD CONSTRAINT paper_moderation_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.question_papers(paper_id) ON DELETE CASCADE;


--
-- TOC entry 4870 (class 2606 OID 17688)
-- Name: paper_questions paper_questions_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions
    ADD CONSTRAINT paper_questions_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.question_papers(paper_id) ON DELETE CASCADE;


--
-- TOC entry 4871 (class 2606 OID 17693)
-- Name: paper_questions paper_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions
    ADD CONSTRAINT paper_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4877 (class 2606 OID 17698)
-- Name: question_media question_media_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4874 (class 2606 OID 17703)
-- Name: question_moderation question_moderation_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4875 (class 2606 OID 17708)
-- Name: question_moderation question_moderation_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.question_papers(paper_id) ON DELETE CASCADE;


--
-- TOC entry 4876 (class 2606 OID 17713)
-- Name: question_moderation question_moderation_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4868 (class 2606 OID 17718)
-- Name: question_papers question_papers_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers
    ADD CONSTRAINT question_papers_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 4869 (class 2606 OID 17723)
-- Name: question_papers question_papers_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers
    ADD CONSTRAINT question_papers_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4864 (class 2606 OID 17753)
-- Name: questions questions_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4865 (class 2606 OID 17733)
-- Name: questions questions_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.course_outcomes(co_id) ON DELETE SET NULL;


--
-- TOC entry 4866 (class 2606 OID 17738)
-- Name: questions questions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


-- Completed on 2025-10-04 20:38:56

--
-- PostgreSQL database dump complete
--

\unrestrict uuZBBdAf0FElWFLkRcDYZWBbaPcVLGILO0rQhkh9WJWp84RzoYsbd8v3BL6s7mk

