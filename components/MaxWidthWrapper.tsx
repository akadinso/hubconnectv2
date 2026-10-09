import { cn } from "cn";
import React from "react";

const MaxWidthWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`mx-auto px-4 sm:px-8 lg:px-10`, className)}>
      {children}
    </div>
  );
};

export default MaxWidthWrapper;
