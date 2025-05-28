--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: macosx
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO macosx;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: macosx
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO macosx;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: macosx
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE drizzle.__drizzle_migrations_id_seq OWNER TO macosx;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: macosx
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: macosx
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    appointment_date timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.appointments OWNER TO macosx;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: macosx
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.appointments_id_seq OWNER TO macosx;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: macosx
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: macosx
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    specialization character varying(100) NOT NULL,
    license_number character varying(50) NOT NULL,
    is_available boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.doctors OWNER TO macosx;

--
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: macosx
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.doctors_id_seq OWNER TO macosx;

--
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: macosx
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: macosx
--

CREATE TABLE public.medical_records (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    diagnosis text NOT NULL,
    prescription text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.medical_records OWNER TO macosx;

--
-- Name: medical_records_id_seq; Type: SEQUENCE; Schema: public; Owner: macosx
--

CREATE SEQUENCE public.medical_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.medical_records_id_seq OWNER TO macosx;

--
-- Name: medical_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: macosx
--

ALTER SEQUENCE public.medical_records_id_seq OWNED BY public.medical_records.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: macosx
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    date_of_birth timestamp without time zone NOT NULL,
    gender character varying(10) NOT NULL,
    contact_info character varying(255) NOT NULL,
    insurance_provider character varying(100),
    insurance_number character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.patients OWNER TO macosx;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: macosx
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.patients_id_seq OWNER TO macosx;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: macosx
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: macosx
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'doctor'::character varying NOT NULL,
    doctor_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO macosx;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: macosx
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO macosx;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: macosx
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: macosx
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- Name: medical_records id; Type: DEFAULT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.medical_records ALTER COLUMN id SET DEFAULT nextval('public.medical_records_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: macosx
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	7c54f86a6bbdf35da89236bcf0009cae12a7fe566da6467e2610a4cd42968f70	1748338570350
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: macosx
--

COPY public.appointments (id, patient_id, doctor_id, appointment_date, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: macosx
--

COPY public.doctors (id, first_name, last_name, email, phone, specialization, license_number, is_available, is_active, created_at, updated_at) FROM stdin;
1	Doctor	User	doc@health.com	0797737344	Pediatrics	KMPDB123789	t	t	2025-05-27 12:59:36.408688	2025-05-27 17:40:36.85
2	Dentist	User	doc2@health.com	0797737344	Dentist	KMPDB123780	t	t	2025-05-27 13:03:58.971126	2025-05-27 17:40:48.014
3	Dr. James	Ochieng	james.ochieng@knh.co.ke	+254 734 567 890	Internal Medicine	KMPDB123456	t	t	2025-05-27 21:13:04.980141	2025-05-27 21:13:04.980141
4	Dr. Mary	Wambui	mary.wambui@knh.co.ke	+254 745 678 901	Pediatrics	KMPDB789012	t	t	2025-05-27 21:13:04.980141	2025-05-27 21:13:04.980141
5	Dr. Sarah	Johnson	sarah.johnson@knh.co.ke	+254 756 789 012	Cardiology	KMPDB345678	f	t	2025-05-27 21:13:04.980141	2025-05-27 21:13:04.980141
6	Dr. Michael	Chen	michael.chen@knh.co.ke	+254 767 890 123	Neurology	KMPDB901234	t	t	2025-05-27 21:13:04.980141	2025-05-27 21:13:04.980141
7	Dr. Lisa	Wang	lisa.wang@knh.co.ke	+254 778 901 234	Pediatrics	KMPDB567890	t	f	2025-05-27 21:13:04.980141	2025-05-27 21:13:04.980141
\.


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: macosx
--

COPY public.medical_records (id, patient_id, doctor_id, diagnosis, prescription, notes, created_at, updated_at) FROM stdin;
1	1	3	Type 2 Diabetes	Metformin 500mg twice daily	Patient shows good glycemic control. Continue with current medication and lifestyle modifications.	2025-05-27 21:13:04.983582	2025-05-27 21:13:04.983582
2	2	4	Malaria	Artemether-Lumefantrine 20/120mg tablets	Patient responded well to treatment. Complete full course of medication.	2025-05-27 21:13:04.983582	2025-05-27 21:13:04.983582
3	3	5	Hypertension	Amlodipine 5mg daily	Blood pressure readings show improvement. Continue medication and regular monitoring.	2025-05-27 21:13:04.983582	2025-05-27 21:13:04.983582
4	4	6	Migraine	Sumatriptan 50mg as needed	Patient reports reduced frequency of headaches. Continue current treatment plan.	2025-05-27 21:13:04.983582	2025-05-27 21:13:04.983582
5	5	7	Common Cold	Paracetamol 500mg as needed	Symptoms improving. Rest and hydration recommended.	2025-05-27 21:13:04.983582	2025-05-27 21:13:04.983582
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: macosx
--

COPY public.patients (id, full_name, date_of_birth, gender, contact_info, insurance_provider, insurance_number, created_at, updated_at) FROM stdin;
1	Kamau Njoroge	1985-06-15 00:00:00	male	0722334455	AIA	1234567890	2025-05-27 21:13:04.970645	2025-05-27 21:13:04.970645
2	Wanjiku Muthoni	1990-03-20 00:00:00	female	0722334455	AIA	1234567890	2025-05-27 21:13:04.970645	2025-05-27 21:13:04.970645
3	John Doe	1978-12-05 00:00:00	male	0722334456	SHIF	9876543210	2025-05-27 21:13:04.970645	2025-05-27 21:13:04.970645
4	Jane Smith	1995-08-15 00:00:00	female	0722334457	CIC	4567891230	2025-05-27 21:13:04.970645	2025-05-27 21:13:04.970645
5	Peter Parker	1988-04-25 00:00:00	male	0722334458	Britam	7891234560	2025-05-27 21:13:04.970645	2025-05-27 21:13:04.970645
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: macosx
--

COPY public.users (id, email, password, first_name, last_name, role, doctor_id, created_at, updated_at) FROM stdin;
1	admin@health.com	$2a$10$No.tJCs8xyE48hIb2JuPZu6p7aJcR5VeerTHH8GHGiFGzcj8ArKyS	Admin	User	admin	\N	2025-05-27 12:39:01.840632	2025-05-27 12:39:01.840632
2	doc@health.com	$2a$10$RQ9lSgoptS.8ll1oa7W9UO1mteTtYmGNX13.32lcvENbKnX6.K/tK	doctor	User	doctor	1	2025-05-27 12:59:36.408688	2025-05-27 12:59:36.408688
3	doc2@health.com	$2a$10$MikiveANq9fQQ8GpaSBRvOjEUDP3tn9lx9pANT0DSa6HVvljK/d7K	Dentist	User	doctor	2	2025-05-27 13:03:58.971126	2025-05-27 13:03:58.971126
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: macosx
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: macosx
--

SELECT pg_catalog.setval('public.appointments_id_seq', 1, false);


--
-- Name: doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: macosx
--

SELECT pg_catalog.setval('public.doctors_id_seq', 7, true);


--
-- Name: medical_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: macosx
--

SELECT pg_catalog.setval('public.medical_records_id_seq', 5, true);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: macosx
--

SELECT pg_catalog.setval('public.patients_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: macosx
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: macosx
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_email_unique; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_email_unique UNIQUE (email);


--
-- Name: doctors doctors_license_number_unique; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_license_number_unique UNIQUE (license_number);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: appointments appointments_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: medical_records medical_records_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: medical_records medical_records_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: users users_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: macosx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- PostgreSQL database dump complete
--

