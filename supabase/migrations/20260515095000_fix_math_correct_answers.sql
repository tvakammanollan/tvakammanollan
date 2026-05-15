-- Auto-generated math (XYZ/KVA/NOG) correct_answer fixes
-- Source: AI-assisted batch audit of cleaned math questions (2026-05-15)
-- Idempotent via AND correct_answer = '<old>'

DO $$
DECLARE
  rc int;
  total int := 0;
BEGIN
  -- KVA: 8/27≈0.296 < 5/2=2.5
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '5c1e772c-1cfc-4ce5-877d-47d718cb3e61' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: xyz=0,x>3: mean depends on y,z (can be > or < x)
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '59a170a5-6cb2-40d6-bc78-f061d610aa1a' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x>y>0: x-y>0>y-x, I>II
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '082b48d3-cc1d-4cc8-86e3-b5af725f0c47' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: I=2-2y, II=3y; equal only if y=2/5
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'ec2a2ecb-03b9-488b-bf22-f99491d0f739' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: y=7, z=13, median(y,z)=10 < 11
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '54569dd0-9aa7-4157-9158-18899165ff48' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: f(x)=x^4+15 even, f(a)=f(-a), diff=0
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '07f9e72d-1537-46e0-9f4c-6b36c2f8e5f8' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x>1: x^5 > x^4
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'f9b82b82-3e8e-42c0-8499-4d05e4c5428b' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x+y=3, x1<x2 => y1>y2
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'd4d0f63c-6d4c-4700-8c73-6708e942d6d3' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: P(sum>=10)=6/36=P(sum<=4)
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '017e6727-2eb0-488f-80eb-838703d3170a' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x,y<0,x=2y: xy>0, x+2y<0, so I>II
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'f0b88af5-e95f-4a5e-9115-8a884700a81a' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: (x+y)^2 = x^2+y^2+2xy > x^2+y^2 for x,y>0
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '7859f72d-e209-4150-b9e6-bf8ff7493173' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Sum equals 1 (=28/28); 55/56 < 1
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'ad9a2fc0-e2d6-4aab-a2d8-d51276881f7c' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: I=11+F, II=F+8, I-II=3>0
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '6bc44060-5b0e-4e8b-a445-ac97a0bf4eed' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Mean of 5 pos + 5 neg integers not determined
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '736e63e5-292a-4f99-a157-c65463b62064' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: πd=π≈3.14 > 3 (triangle perimeter)
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'c4bf3004-361f-4be0-b26d-52a5d2048190' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: y=x+1; 2x < x+y = 2x+1
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = 'ba46aaf7-27b2-4068-9374-38c8cd259c98' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x can be 6 (<20) or 21 (>20) with valid positive integer y
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'bbfd0383-234e-4953-badc-e19ccf70c555' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 9/8 < 12/8
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '464752ce-ad12-47b2-8ef1-fc7c545ea13a' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: V=27π≈84.8 > 30
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '9c22956b-8262-4c7c-bdcc-59a717284a1a' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: f and g are identical functions, same roots
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'f37eda4c-a47a-4027-a38c-e102111e8024' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: No constraint on x; relation varies by x
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '9497508b-660d-4d99-8458-f6070f80abf3' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: (1,10) mean 5.5 or (2,5) mean 3.5
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'dba4ba4b-2c34-4f4f-bdac-dc4c01a6a233' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Both speeds = 2x/y
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'b0692e46-c2ef-4880-8696-1e17dfce5173' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: I=x^2+42, II=x^2+1; I-II=41
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'f0a4278a-323b-465b-89e7-3635de1a4597' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: f(10)=-100=f(0)
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '38e9d2b6-afc6-403b-9a8e-0e032a80f15d' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: h=3d, circumference=πd; πd>3d
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '302fb6e8-6ea4-4fba-af14-70cf971d5674' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x=-1, y=-1/2; -1 < -1/2
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '4417eea9-0263-48e1-8b36-2477240d2a1e' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: P(6/x)=1/5 (only x=3); P(39/x)=2/5 (x=3,13)
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '8b5c4bd3-c38d-47ab-a6f7-969ba4a2aa37' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x²=4 → x⁴=16. (x+x)(x+x)=4x²=16. Equal.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'a95f82d5-9102-4db4-8aad-6410452cb783' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 5⅕+1=6.2 > 3 1/15 + 1 ≈ 4.067.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '969e8447-29b7-4e70-87b6-f2abc6a9beb3' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: f(x)=5-10x is decreasing; x1>x2 → f(x1)<f(x2), so II>I.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '89f995bb-ba08-4e30-94a1-593f0b5c8072' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 26 ink pens, 13 non-ink, 19 broken. Broken ink ranges from 6 (if all 13 non-ink broken) to 19. Could equal 6, so not strictly >6.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '224aedb4-87d5-485d-8281-f4cb5549d270' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x>y combined with xz>yz forces z>0.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '8ed86bf1-a22f-4415-8a9b-76baee239460' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x²+x-8=0 gives x=(-1±√33)/2; one root positive (~2.37), one negative (~-3.37).
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'c916212f-3f6e-4df3-ae61-1daf22b346ef' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x/162=y/20500 — without sign/positivity info, x vs y indeterminate (e.g., negative ratio reverses).
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '95c5fa95-77e1-4844-8587-e2f1844c545a' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Quantity I (x/(x+1)+1/(x+1)) simplifies to 1; for x>0, x can be <1 or >1, so 1 vs x is indeterminate.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'e6ef142b-6c1f-47b8-8b30-cc8c10dc198d' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: (a+b)²+(a-b)²=2a²+2b² vs 4a²+b². Sign depends on whether b²>2a² or not.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '372642ad-43cf-417d-bae8-e27c93377ca3' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 6.3 h = 378 min < 420 min.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '702e27a8-8ca2-490d-82ee-130adc6307a7' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: -x+9=11 → x=-2, which is less than 0.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '34b8e9f0-35b7-47d6-921e-7774e7b8ce37' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 7^8 < 7^16.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '4a943cfb-cdec-4a8d-9bce-9763033bf1be' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: No constraints given on x,y; xy³ vs (xy)²/2 indeterminate.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '164435e2-627c-4fef-810b-9df41bf8103f' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: From the system one gets x=z and y=w, but no relation between y and z.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '973dbd99-2ac5-4986-a502-c14b5f863f34' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Rectangle, E on AB. Area(AED)+Area(EBC) = AD·AE/2 + BC·EB/2 = AD·AB/2 = Area(ECD).
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '61bce3ae-d3c0-4150-8472-962627e53a13' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Large-not-red = 30-15 = 15; Red-not-large = 30-15 = 15.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '6d998760-86b1-4c5a-a213-6a1790cb4b43' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 13% of 55 = 7.15 > 14% of 50 = 7.0.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'd1f5871b-7ed3-466c-be3e-4230cdf77d23' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: P(same)=2·(1/2)·(1/2)=1/2; P(different)=2·(1/2)·(1/2)=1/2.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '89af2a04-9aa3-4dc8-92ba-114693bc99da' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: xy-y=x-yx → 2xy=x+y → x=y/(2y-1). For 0<y<1/2, x is negative; for other y, x can be ≥0. Indeterminate.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'c8fcde84-e1c7-4e6a-b278-469ccc0497d4' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: (zw/xy)/(yw/zx) = z²/y²; positivity alone doesn''t fix z vs y.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'b142b068-31e2-4999-a019-4cfcfc8961f6' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Isosceles, perimeter 40, side 12: either (12,12,16) → largest 16, or (12,14,14) → largest 14. Largest vs 15 indeterminate.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'ab668e46-63a1-4aa5-aba7-eca664ba8661' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: y=1/x - x/2 = 0 gives x=±√2 ≈ ±1.41, both less than 3.5. II>I.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '6d2ac49e-b6fd-416f-b401-cf0a9d9bcf56' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: L1 slope = 1/6, L2 slope = -3. 1/6 > -3, so I>II.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '616fbb74-c0cd-42c0-b454-f61d948f7f04' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: |22-(-4)|=26, |3-(-21)|=24. I>II regardless of y.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '38fa6ec7-64cd-453d-aa4f-70736b5fd8ac' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Two circles intersecting at two points: |R-r|<d<R+r. Distance d can be less than or greater than R (e.g., R=2,r=1 → d ∈ (1,3)).
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '973bf499-7299-44cc-a6bf-7397c7f37b50' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x=3y-3: not equal in general. y=1.5 gives x=y=1.5 (equal); y=3 gives x=6>y. Depends on y.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'cf52c170-4940-44fb-841f-c24181ef9eda' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Sorted: 1,5,5,6,8. Median=5, mean=25/5=5. Equal.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '7a5bd4bd-8888-4946-80e3-90f451c75007' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 26/8 = 3.25 < 8. II>I.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = 'c319e5ec-d446-4e94-b7d6-5b80ca90ea40' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: (x/3)/4 = x/12 and (x/4)/3 = x/12. Always equal.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '87bdd4f1-e8d2-442f-b50a-171de81a9f0e' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 4<2x-2<8 → 3<x<5, so x<6 always. II>I.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = 'd7db2b2e-63cb-43f5-8a80-8b69cd64fdfd' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 3²+1 = 10 < 11. I>II.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '79b068a0-2f9a-424f-bdf7-2ef49686a182' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Circle: r²π=9π → r=3. Square: side=√3 ≈ 1.73. I>II.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'fabc2f95-cf17-4fd5-93f4-073d8494b8eb' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Set square side=1. G = intersection of AF (y=x/2) and BE (y=-2x+2) at (0.8,0.4). Area(ABG)=0.2; Area(CEGF) by shoelace = 0.2. Equal.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'ad843c7c-69f0-4e41-8d14-059a67b74a7d' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: I-II = 2 - 4/x. x=1: I<II. x=10: I>II. Depends on x.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '0744498a-7c3b-423c-b949-3f44d7fe2f65' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 8x+4=10 → 4x+2 = (8x+4)/2 = 5. 5<8, so II>I.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '5028aa08-a74f-4d8e-808a-5ed8fda9ed4e' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Distance from origin to (a,b) is √(a²+b²); to (b,a) is √(b²+a²). Always equal.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '1651c4b3-1697-4874-8ee5-5b8c5c6858c7' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: I-II = 4x-4. Sign depends on x (positive if x>1, negative if x<1, zero at x=1).
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'bbba1b8a-c299-4bfe-b64f-3969247b38f7' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: 0<k<m<n: nm vs mk → m(n-k)>0 since n>k>0. I>II.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '105a7c9a-eedf-4645-aea8-87a4f37cc8e4' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x+2y=54116. Max x (y=1): x=54114. Max y (x=2): y=27057. 54114 > 27057.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '143df03f-1cb3-402e-bdcd-b50cd3292985' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Anna_now = Bea_2yrs_ago + 4 = Bea_now + 2. Anna_2yrs_ago = Anna_now - 2 = Bea_now. Equal.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'a3a72afb-7f0c-4d8a-b1fe-a7285201fdb0' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Isoceles AB=BC=7, height to AC = 4. AC/2 = √(49-16) = √33, so AC = 2√33 ≈ 11.49 < 12.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '9c5a16a6-bd27-4cb2-8a3d-101c92c89c32' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: a=b+c with c<0 ⇒ a<b. II>I.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '12adeecf-35d3-4941-90c4-b7c28d7d8712' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x³=19 → x≈2.668. y⁶=19 → y=±19^(1/6)≈±1.638. In both cases x>y.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'c2082d3e-146d-49ee-a334-c1fd291c0229' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: P=(-3m,0), Q=(0,3). |OP|=3|m|, |OQ|=3. Equal only when |m|=1; depends on m.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'b098fd9f-a3e8-427a-9dd1-a84a6d72558c' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: I = (4/5)*200/15 ≈ 10.67 min; II = (2/3)*200/10 ≈ 13.33 min. II > I.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '00b1029b-4f19-4e30-999b-633362f088e3' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: x - y = -3 means x < y for all real x,y, so II > I (determinate).
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '1dfdaa21-6568-4f98-b402-af43705be188' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- KVA: Right triangle: hypotenuse^2=3721, smallest leg^2=121. Middle leg^2 = 3721-121 = 3600, side = 60 m > 59. I > II.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '25de8b42-dd9e-43c5-820f-699e83d08569' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #1 Each equation alone is one equation in two unknowns; together: 2(x+y)=52 and 3x+2y=39 gives x=-13. Sufficient only together.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'a49b292d-6415-4b99-9b94-372259f9e580' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #2 (1) median=135 (3rd-priced dish) alone does not give top-two sum. (2) top three sum 490 alone lacks 3rd price. Together: top two = 490-13
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '6819c583-4aca-43cc-8906-f749d594891c' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #9 (2) gives yellow=15 and brown=0.4*15=6, so difference=9. (2) alone is sufficient.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '260ded74-cf7e-4056-a266-e5ddfab44e14' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #13 (1) gives only distance (7 km), not Carola''s time. (2) gives only Carola''s time (35 min), not distance. Both needed.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '98953281-b978-4bc7-96fc-8ddb79d21c87' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #16 (1) C+S=36.8 only yields water=3.2, not cement individually. (2) V+S=31.2 yields cement=40-31.2=8.8. Only (2) alone is sufficient.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '4acc57d5-8f83-4bbd-8a76-a6c95d154b2c' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #23 (1) alone: ratio without counts. (2) alone: counts without ratio. Together: 6-k=2(4-k) gives k=2, so dam-without-sadelskydd=2.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '3032bbbd-33ae-4f2a-b8fb-930ca04042a7' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #30 (1) genväg=gångväg-410 combined with given genväg=gångväg/2 yields gångväg=820, genväg=410. (2) gives genväg+gångväg=1230 with the same 
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'b486d3ed-f616-4f62-a6a2-05ee9bb6671c' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #33 (1) yields girls with moped=4 (12 each, 14 without moped → 6 boys with, so 8 girls without, 4 girls with). (2) yields the same uniquely:
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'e6f7333b-9d98-44ac-817c-dc687776b0d0' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #35 Together the cases (häft=blue,nålar=red→gem=white), (häft=blue,nålar=white→gem=red), (häft=red,nålar=white→gem=blue) are all consistent.
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = '08b0928f-7740-470a-9f5e-44b3ea9bb178' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #36 (1) x=±3. (2) one equation in x and b. Together both x=3 (b=-14/3) and x=-3 (b=14/3) satisfy. x not unique even together.
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = 'c86544c1-780d-452b-9545-b131cb5b6c07' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #38 (1) 1/3 of blue large; (2) 1/2 of red large. Total share of large = b/3 + (72-b)/2 depends on the unknown number of blue balls. Not suff
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = 'a224121c-c10e-4961-b6ba-c1c1151c4dbe' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #40 Both statements give the same single relation t_A - t_I = 0.5; one equation in two unknowns, so the combined time cannot be computed eve
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = '4939e084-b052-4af0-86f5-abb5fc4387d5' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #51: (1) likbent + rätvinklig forces 45-45-90, sufficient. (2) only ''at least one angle 45°'' doesn''t fix the triangle (e.g. 45-60-75). On
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '30605569-8735-45ed-9064-7a7724a759bc' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #52: (1) gives {934, 394}. (2) gives {394, 934, 349}. Together {394, 934} – two options remain. Not sufficient → E.
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = 'c5eef362-b728-4543-974c-0c6ed00a9087' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #54: (2) z-x=28 alone doesn''t fix sum (y free). Together with ratio 3:5:7: 4k=28→k=7, sum=15·7=105. Only together → C.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'f65ac55d-ae91-4005-913b-dbfdf31dd23a' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #57: (1) all negative, n odd → product of odd # of negatives is negative. Sufficient alone. (2) striking two with positive product leaves ne
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '8a8d8a22-b5db-4217-90e2-0a10fac8b43f' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #64: x+y=2x iff y=x. (1) y=0 alone – truth depends on x being 0, x unknown. (2) x=6 alone – depends on y=6. Together x=6,y=0: 6≠12, definite
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '9a189d67-72e9-464c-be49-feb6860b4265' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #68: (1) S/n+20=S/(n-8) is one eq in two unknowns – not sufficient alone. (2) n=20 alone gives no sum. Together: S=600. Only together → C.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '077ff85e-b2a6-40e9-9941-c58c3f5cba17' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #76: (1) n-(n/2+0.5)=7 → n=15. Sufficient alone. (2) rate 6 per 30s × 75s = 15. Sufficient alone. → D.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '1a83a1d4-66ea-436e-80b8-2701beb5913a' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #79: (1) only 19.25 kg total – no per-tile weight known, count not determined. (2) side 30cm → 0.09 m²/tile, 0.99/0.09=11. Only (2) → B.
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '0af5c892-8276-4cca-9ff1-b3b7e0d9d6ad' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #80: actual=1.5·normal. (1) 1.5t-t=5 → t=10. Sufficient alone. (2) 10 km gives no time. Only (1) → A.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '4176f640-7231-454e-bfcb-82c694ac2ac1' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #81: 125=20a+5b. (1) b<5: only b=1 works (a=6). (2) a>5: a=6, b=1 unique (a≥7 exceeds 125). Each alone uniquely determines → D.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '71f7f3ce-5ed2-4b6f-9155-0a2df18f63c1' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #91: Multiples of 9 in {21,24,27,30,36,45}: {27,36,45}. Odd: {21,27,45}. Together (odd ∧ mult9): {27,45} – still two options. Not unique eve
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = 'cd75b2c4-bfaa-40dc-a1b0-bdf3a694b0fc' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #92: From a+b+c+d=20, a+c+e=23. (1) b+d=10 → a+c=10 → e=13. Sufficient alone. (2) gives a=3,b=1 but c free among many distinct-positive choi
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '90737a82-d117-4d49-b0b1-0729216fc2fd' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #93: (1) r/(s+r)=1/4 → s=3r, v unknown – not sufficient. (2) s/(s+v)=6/10 → s/v=3/2, r unknown – not sufficient. Together: s=3r, v=2r → P(vi
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '76ab05ac-19e6-4f5e-a288-7bf9485b9b1f' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: #94: With (1), #2 is a woman (savings opener, not Anton, not Martin) but Martin''s position unfixed → #1 indeterminate. With (2), #1 cashes 
  UPDATE public.questions SET correct_answer = 'E'
   WHERE id = 'aacc8309-0372-43da-9405-f951e486854f' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: K&F must be on the same floor (Olga differs from both). (1) leaves 2 valid configurations. (2) forces Anna lower, Katja upper, hence Fatima 
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = 'a55a2a32-32be-4dea-ba95-4f3b407d874e' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: (1) Table area = 400π, cloth area = 400 → P(outside) = 1 - 1/π, sufficient. (2) Right triangle with hypotenuse=diameter has variable legs → 
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'fcaf4fdd-1800-468f-b872-3fa9d1b1154c' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: (1) water = 8/9 of depth = 480 → depth = 540. (2) water:above = 8:1, water = 480 → depth = 540. Each alone sufficient.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '4451114e-50c3-4105-874d-371bfad995e8' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: (2) gives p=2m, r=m+100 — unknown m. (1) gives r=m+p — alone insufficient. Together: 3m = m+100 → m=50, r=150.
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '78a912ee-9e61-4fa8-88cd-4aa242d0fb7c' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: Sto is in the middle, so hingst is at an end and adjacent only to sto. (1): hingst svart, next to brown horse → sto is brown → föl is white.
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '1f49120e-3b79-4c95-949e-350230a3c9ac' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- NOG: 30 total. (1) Need ≥12 to guarantee a kantarell → 11 champinjoner → 19 kantareller. (2) Need ≥20 to guarantee a champinjon → 19 kantareller.
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '49bcceab-0d7a-44d1-8ae9-a51e7d009d80' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Sequence multiplies by 3 and subtracts 15: 55*3-15=150, 150*3-15=435, 435*3-15=1290. x=3, y=15, x+y=18 = option C
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '45f6e9af-2fba-4b8b-9461-23e5d348a5c3' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: f(x)=x^2 on [0,3] yields range [0,9], which is option D
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'bee1bc95-116a-4fd7-89c1-fdcd8ed37f1e' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Volume = 2 dm * 0.5 dm * 30 dm = 30 dm^3 (or 20cm*5cm*300cm=30000 cm^3 = 30 dm^3), option B
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '3d141a16-a0b2-4632-99b0-121098873952' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Sum of 6 numbers = 66; 5+15+17+23=60; x+y=6; mean=3 = option B
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = 'ae7ca2fd-e5d7-4508-b86b-d56be4655fb4' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: y1*x1*y2*x2 = 2*2*1*1 = 4; option A is y1*x1 = 2*2 = 4, matches
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '3ae8ce35-1240-4275-a7f6-f48aa1172117' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Mean=median=8, sum=24. Numbers a, 8, a+10 sum to 24, so a=3 and largest = 13 = option B
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '81a69295-627b-4933-a011-b8a3bddcf538' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: (3,3) on y=kx-3 gives k=2; at x=-3, y=2*(-3)-3=-9 = option A
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'eda12794-753d-480c-bb2f-9219fe66cc1b' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Primes between 27 and 36 are 29 and 31; mean = 30 = option B
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '749317b6-3ce0-4270-93d9-eb8fcaa87712' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: (7+13+18+20+x)/5=15 means 58+x=75, so x=17 = option C
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '2d8aaa11-4f66-42c7-ae52-2390884d3fb9' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Option D states -xy > -zw, which is equivalent to zw > xy (given). Option A (w>x) can be falsified with z=-1,w=-2,x=-1,y=-1 (zw=2>1=xy but w
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'a831b0e5-566a-43d0-b45f-9641327e108c' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Given x<y<0; option A (y<x<0) contradicts the given. Option D (xy>0) is always true since product of two negatives is positive
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '799d8b1d-315d-4db8-af4e-7af2103dfd61' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Diagonal of square with side a is a*sqrt(2), not a/sqrt(2)
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'f26aa1c3-edca-4e61-b8f1-1ba7f8180e76' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: (x+1)(x-1) = x^2 - 1 = 121 - 1 = 120
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '32884bd5-9de3-4a29-abd1-6a99007efe12' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: f(0)=C=4, f(3)=4a^3=500 -> a^3=125 -> a=5
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '0d3476bf-f7ef-4b0e-a3dd-2b0cd6032b9d' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x^2-4x=0 -> x(x-4)=0 -> x=0 or x=4; only x=0 is in options (D)
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = 'afe04730-effe-4970-9bc6-64f93c7ac0d3' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Two odd integers summing to 16: max product is 7*9=63
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '2662815c-32b8-4304-937d-cdd1722a0a4b' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: (a+y+z)/3 = x -> a = 3x - y - z
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'dacc227b-ab80-4dd0-b229-158f9185b472' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: y=5 gives 25<30<36; y=4 fails since 30>25
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '7d435c29-641a-42c2-a87c-cb7c61c7c5c6' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: 897 = 128*7 + 1, remainder is 1
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '33423ab8-70e1-4069-8f03-bc3e2b2a68d7' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: 8 consecutive ints with median -1.5: -5,-4,-3,-2,-1,0,1,2; smallest is -5
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = 'ea189466-c8b7-455e-8794-fef2ea7bc466' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: 0.8x = 140 -> x = 175
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'ccb08fb3-b6e6-4142-93ca-1e945e48727f' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x=11, y=5; mean of x and y is (11+5)/2 = 8
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '096b31da-b16a-483b-bd19-6f3938ae8a2c' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: (3x-1)(2x) - x(3x-2) = 6x^2-2x-3x^2+2x = 3x^2
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '77ca9fd2-f5bf-4c2c-835f-9ce9a50d9a17' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x=y so x^n - y^n = 0
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '9dc90004-d124-4a59-a400-a4668d4c32ca' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Midpoint of (-3,-2) and (7,4) is (2,1)
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '49838493-fb31-42f5-b4e2-4483ca6ddc38' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: (x+y)^2 - x^2 = 2xy + y^2
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = 'b88dd749-a40d-4eb5-a4cb-30cb3bfe1f3a' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x=2: 4+4-1 = 7
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '2e63d841-7bc5-4c0d-a6a5-da1c136e8a33' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Changing m only shifts the line vertically; slope k unchanged
  UPDATE public.questions SET correct_answer = 'D'
   WHERE id = '5701c582-1d49-4c94-88e8-fe4732332cf2' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x^2+x-6=(x+3)(x-2)=0 gives x=-3 and x=2
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = '0e0f917c-18fb-4159-b17f-9a6eed11a6f5' AND correct_answer = 'A';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: Total energy 180 kcal; fat 13.5/180 = 7.5%
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = '6902885c-32ae-4b5c-a564-51414bc85503' AND correct_answer = 'C';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x-w=-y => w=x+y; with all distinct, only z=0 works
  UPDATE public.questions SET correct_answer = 'C'
   WHERE id = 'a6ba4662-10c6-432a-b3ef-a36f0500c989' AND correct_answer = 'B';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x^2 y^2 z = 9*4*(-1) = -36, the smallest value
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '257c958b-900d-467a-a35b-17ab7465a258' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: x^4-2x^3=x^3(x-2)=0 => x=0 or x=2; (2,0) is the listed x-intercept
  UPDATE public.questions SET correct_answer = 'A'
   WHERE id = 'aef88ae0-956e-4da8-bd3e-ccc5ff0eef88' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  -- XYZ: (a-2b)(a+3b) = a^2 + ab - 6b^2
  UPDATE public.questions SET correct_answer = 'B'
   WHERE id = '5a88610a-1490-47ba-a9fb-159e79617b62' AND correct_answer = 'D';
  GET DIAGNOSTICS rc = ROW_COUNT; total := total + rc;

  RAISE NOTICE 'Fixed % math correct_answer values', total;
END $$;
