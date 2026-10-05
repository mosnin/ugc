"use client";

import { motion } from "motion/react";

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      whileInView={{
        opacity: 1,
      }}
      transition={{
        duration: 0.25,
        ease: "easeInOut",
      }}
      viewport={{ once: true }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default Container;
