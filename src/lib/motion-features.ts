/**
 * Framer-motions feature-paket, laddat asynkront av <LazyMotion> i __root.
 * Hamnar i en egen chunk → animations-runtimen ligger inte i entry-bundlen.
 * domMax krävs (inte domAnimation) eftersom TestimonialStackCard använder drag.
 */
export { domMax as default } from "framer-motion";
