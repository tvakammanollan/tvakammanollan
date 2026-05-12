ALTER TABLE public.users DISABLE TRIGGER USER;
UPDATE public.users
SET elo_verbal = 1000,
    elo_math = 1000,
    elo_verbal_peak = GREATEST(elo_verbal_peak, 1000),
    elo_math_peak = GREATEST(elo_math_peak, 1000)
WHERE email = 'niklas@callsy.se';
ALTER TABLE public.users ENABLE TRIGGER USER;