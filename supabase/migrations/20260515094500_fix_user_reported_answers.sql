-- Fix user-reported wrong correct_answer values
-- Source: question_reports-export-2026-05-15_09-46-47.csv (15 reports, 14 unique questions)
-- Manually verified by solving each problem. Idempotent via AND correct_answer = '<old>'.
-- Skipped: 78e29ced (broken question — no correct option), 25de8b42 (truncated text).

DO $$
DECLARE
  rc int;
  total int := 0;
BEGIN
  -- ORD PERFORERA: göra hål i (E), not "vika ihop" (D)
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = '7d48d947-0cbc-42a7-a36c-7d4d26584154' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- ORD RESTRIKTIV: återhållsam (E), not "motvillig" (D)
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = '8c636fe7-e9e5-4734-91a5-f598cdcc6877' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- ORD ATTRIBUT: kännetecken (E), not "innehåll" (B)
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = '81f49a54-3a48-42ad-a295-c165f963ae2d' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- MEK EU/Storbritannien: "unikt – etablissemanget" (D), not "särskilt – borgerligheten" (C)
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '1b4dfe17-5e19-4aa8-9662-729a814fffde' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- MEK skådespelare: "exhibitionistiskt" (D), not "ambivalent" (C)
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '4ea571c3-3630-4a8e-b5b1-a6900c6594e4' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- MEK skilsmässa: "äktenskapsförord" (D), not "avlatsbrev" (C)
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '7e5a36f3-3ade-4f32-86d6-b7128141a239' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA bollar (röda/stora 15=15): C (I lika med II), not B (II>I)
  -- 30 röda, 30 stora, 15 både → 30-15=15 stora ej röda, 30-15=15 röda ej stora.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '6d998760-86b1-4c5a-a213-6a1790cb4b43' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA avstånd origo till (a,b) resp (b,a): C (lika), inte B.
  -- √(a²+b²) = √(b²+a²) oavsett a<b.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '6db21d7b-ccd3-459c-80a4-f68cd71b6175' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA f(x)=x²-10x-100: f(10)=-100, f(0)=-100 → C (lika), inte D (otillräckligt).
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '38e9d2b6-afc6-403b-9a8e-0e032a80f15d' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ 897 mod 7 = 1: svar B (1), inte C (3). 7·128=896, 897-896=1.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '33423ab8-70e1-4069-8f03-bc3e2b2a68d7' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG plattor (0.99 m²): (2) ensam räcker (0.3·0.3=0.09; 0.99/0.09=11), (1) räcker ej.
  -- Svar B (i (2) men ej i (1)), inte A.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '0af5c892-8276-4cca-9ff1-b3b7e0d9d6ad' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ medelvärde av 3 tal är x; två är y,z. Tredje = 3x-y-z (A), inte 3x+y+z (B).
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'dacc227b-ab80-4dd0-b229-158f9185b472' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  RAISE NOTICE 'Fixed % user-reported wrong correct_answer values', total;
END $$;
