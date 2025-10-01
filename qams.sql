--
-- PostgreSQL database dump
--

\restrict UGot4GeRsRlS0yzlLeArAaQxtjQDXPbWLcrSvWs9BnTWP6pV9NQnNw3m14dkCyc

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-01 16:44:09

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
-- TOC entry 5044 (class 0 OID 0)
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
    p integer
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
-- TOC entry 5045 (class 0 OID 0)
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
-- TOC entry 5046 (class 0 OID 0)
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
-- TOC entry 5047 (class 0 OID 0)
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
-- TOC entry 5048 (class 0 OID 0)
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
-- TOC entry 5049 (class 0 OID 0)
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
-- TOC entry 5050 (class 0 OID 0)
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
-- TOC entry 5051 (class 0 OID 0)
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
-- TOC entry 5052 (class 0 OID 0)
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
-- TOC entry 5053 (class 0 OID 0)
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
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4795 (class 2604 OID 17560)
-- Name: course_outcomes co_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes ALTER COLUMN co_id SET DEFAULT nextval('public.course_outcomes_co_id_seq'::regclass);


--
-- TOC entry 4793 (class 2604 OID 17551)
-- Name: courses course_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN course_id SET DEFAULT nextval('public.courses_course_id_seq'::regclass);


--
-- TOC entry 4799 (class 2604 OID 17584)
-- Name: logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs ALTER COLUMN log_id SET DEFAULT nextval('public.logs_log_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 17605)
-- Name: options option_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options ALTER COLUMN option_id SET DEFAULT nextval('public.options_option_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 17630)
-- Name: paper_moderation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation ALTER COLUMN id SET DEFAULT nextval('public.paper_moderation_id_seq'::regclass);


--
-- TOC entry 4812 (class 2604 OID 17624)
-- Name: paper_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions ALTER COLUMN id SET DEFAULT nextval('public.paper_questions_id_seq'::regclass);


--
-- TOC entry 4819 (class 2604 OID 17652)
-- Name: question_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_media ALTER COLUMN id SET DEFAULT nextval('public.question_media_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 17641)
-- Name: question_moderation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation ALTER COLUMN id SET DEFAULT nextval('public.question_moderation_id_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 17614)
-- Name: question_papers paper_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers ALTER COLUMN paper_id SET DEFAULT nextval('public.question_papers_paper_id_seq'::regclass);


--
-- TOC entry 4801 (class 2604 OID 17593)
-- Name: questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN question_id SET DEFAULT nextval('public.questions_question_id_seq'::regclass);


--
-- TOC entry 4796 (class 2604 OID 17570)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5029 (class 0 OID 17557)
-- Dependencies: 230
-- Data for Name: course_outcomes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_outcomes (co_id, course_id, co_number, description) FROM stdin;
\.


--
-- TOC entry 5028 (class 0 OID 17548)
-- Dependencies: 229
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (course_id, code, title, created_by, created_at, l, t, p) FROM stdin;
\.


--
-- TOC entry 5031 (class 0 OID 17581)
-- Dependencies: 232
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (log_id, user_id, action, details, created_at) FROM stdin;
1	1	REGISTER	instructor 1 registered	2025-10-01 16:33:20.280972
2	2	REGISTER	moderator 2 registered	2025-10-01 16:33:40.463481
\.


--
-- TOC entry 5033 (class 0 OID 17602)
-- Dependencies: 234
-- Data for Name: options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.options (option_id, question_id, option_text, is_correct) FROM stdin;
\.


--
-- TOC entry 5036 (class 0 OID 17627)
-- Dependencies: 237
-- Data for Name: paper_moderation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_moderation (id, paper_id, moderator_id, status, comments, reviewed_at) FROM stdin;
\.


--
-- TOC entry 5035 (class 0 OID 17621)
-- Dependencies: 236
-- Data for Name: paper_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_questions (id, paper_id, question_id, sequence, marks, section) FROM stdin;
\.


--
-- TOC entry 5038 (class 0 OID 17649)
-- Dependencies: 239
-- Data for Name: question_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_media (id, question_id, media_url, caption) FROM stdin;
\.


--
-- TOC entry 5037 (class 0 OID 17638)
-- Dependencies: 238
-- Data for Name: question_moderation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_moderation (id, paper_id, question_id, moderator_id, status, comments, reviewed_at) FROM stdin;
\.


--
-- TOC entry 5034 (class 0 OID 17611)
-- Dependencies: 235
-- Data for Name: question_papers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_papers (paper_id, course_id, instructor_id, title, status, version, created_at, updated_at, exam_type, semester, academic_year, full_marks, duration) FROM stdin;
\.


--
-- TOC entry 5032 (class 0 OID 17590)
-- Dependencies: 233
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (question_id, course_id, author_id, question_type, content, co_id, created_at, updated_at, is_active) FROM stdin;
\.


--
-- TOC entry 5030 (class 0 OID 17567)
-- Dependencies: 231
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, password_hash, role, created_at, status) FROM stdin;
1	Rohit 1	rohit1@gmail.com	$2b$10$cA8eqx4P16NX7DOcHyH7MeKxYO8cywQq20.poamq2ekjsuUUaApQe	instructor	2025-10-01 16:33:20.266293	active
2	Rohit 2	rohit2@gmail.com	$2b$10$k2YzaNKcvWaTNDET.xcsDOYG1otSf.FBo1PTMS5rqkQeAjZkaLux6	moderator	2025-10-01 16:33:40.459789	active
3	Super Admin	admin@example.com	$2b$10$MUT1ViQWETj3B.Hd/GUe6eHVKAvmvpwixzcaraqtz04y1P7FgxltK	admin	2025-10-01 16:42:16.084793	active
4	Rohit 3	rohit3@gmail.com	$2b$10$OP46NxylPzy3Ea8hvSr0O.CdcCg3cxlT1JLadpVM6lj52nxF8vIWC	admin	2025-10-01 16:43:11.042714	active
\.


--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 217
-- Name: course_outcomes_co_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_outcomes_co_id_seq', 1, false);


--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 218
-- Name: courses_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_course_id_seq', 1, false);


--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 219
-- Name: logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_log_id_seq', 2, true);


--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 220
-- Name: moderation_moderation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moderation_moderation_id_seq', 1, false);


--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 221
-- Name: options_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.options_option_id_seq', 1, false);


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 222
-- Name: paper_moderation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paper_moderation_id_seq', 1, false);


--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 223
-- Name: paper_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paper_questions_id_seq', 1, false);


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 224
-- Name: question_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_media_id_seq', 1, false);


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 225
-- Name: question_moderation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_moderation_id_seq', 1, false);


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 226
-- Name: question_papers_paper_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_papers_paper_id_seq', 1, false);


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 227
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_question_id_seq', 1, false);


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 4, true);


--
-- TOC entry 4831 (class 2606 OID 17566)
-- Name: course_outcomes course_outcomes_course_id_co_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_course_id_co_number_key UNIQUE (course_id, co_number);


--
-- TOC entry 4833 (class 2606 OID 17564)
-- Name: course_outcomes course_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_pkey PRIMARY KEY (co_id);


--
-- TOC entry 4827 (class 2606 OID 17556)
-- Name: courses courses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_key UNIQUE (code);


--
-- TOC entry 4829 (class 2606 OID 17554)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- TOC entry 4839 (class 2606 OID 17589)
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4843 (class 2606 OID 17610)
-- Name: options options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_pkey PRIMARY KEY (option_id);


--
-- TOC entry 4849 (class 2606 OID 17637)
-- Name: paper_moderation paper_moderation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation
    ADD CONSTRAINT paper_moderation_pkey PRIMARY KEY (id);


--
-- TOC entry 4847 (class 2606 OID 17626)
-- Name: paper_questions paper_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions
    ADD CONSTRAINT paper_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 4853 (class 2606 OID 17657)
-- Name: question_media question_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_pkey PRIMARY KEY (id);


--
-- TOC entry 4851 (class 2606 OID 17648)
-- Name: question_moderation question_moderation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_pkey PRIMARY KEY (id);


--
-- TOC entry 4845 (class 2606 OID 17620)
-- Name: question_papers question_papers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers
    ADD CONSTRAINT question_papers_pkey PRIMARY KEY (paper_id);


--
-- TOC entry 4841 (class 2606 OID 17601)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- TOC entry 4835 (class 2606 OID 17580)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4837 (class 2606 OID 17578)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4855 (class 2606 OID 17658)
-- Name: course_outcomes course_outcomes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 4854 (class 2606 OID 17663)
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4856 (class 2606 OID 17668)
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4860 (class 2606 OID 17673)
-- Name: options options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4865 (class 2606 OID 17678)
-- Name: paper_moderation paper_moderation_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation
    ADD CONSTRAINT paper_moderation_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4866 (class 2606 OID 17683)
-- Name: paper_moderation paper_moderation_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_moderation
    ADD CONSTRAINT paper_moderation_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.question_papers(paper_id) ON DELETE CASCADE;


--
-- TOC entry 4863 (class 2606 OID 17688)
-- Name: paper_questions paper_questions_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions
    ADD CONSTRAINT paper_questions_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.question_papers(paper_id) ON DELETE CASCADE;


--
-- TOC entry 4864 (class 2606 OID 17693)
-- Name: paper_questions paper_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_questions
    ADD CONSTRAINT paper_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4870 (class 2606 OID 17698)
-- Name: question_media question_media_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4867 (class 2606 OID 17703)
-- Name: question_moderation question_moderation_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4868 (class 2606 OID 17708)
-- Name: question_moderation question_moderation_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.question_papers(paper_id) ON DELETE CASCADE;


--
-- TOC entry 4869 (class 2606 OID 17713)
-- Name: question_moderation question_moderation_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_moderation
    ADD CONSTRAINT question_moderation_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4861 (class 2606 OID 17718)
-- Name: question_papers question_papers_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers
    ADD CONSTRAINT question_papers_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 4862 (class 2606 OID 17723)
-- Name: question_papers question_papers_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_papers
    ADD CONSTRAINT question_papers_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4857 (class 2606 OID 17728)
-- Name: questions questions_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4858 (class 2606 OID 17733)
-- Name: questions questions_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.course_outcomes(co_id) ON DELETE SET NULL;


--
-- TOC entry 4859 (class 2606 OID 17738)
-- Name: questions questions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


-- Completed on 2025-10-01 16:44:10

--
-- PostgreSQL database dump complete
--

\unrestrict UGot4GeRsRlS0yzlLeArAaQxtjQDXPbWLcrSvWs9BnTWP6pV9NQnNw3m14dkCyc

