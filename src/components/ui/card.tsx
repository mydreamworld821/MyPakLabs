import * as React from "react";
import { cn } from "@/lib/utils";
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "glass";
}
const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  className,
  variant = "default",
  ...props
}, ref) => {
  const variants = {
    default: "bg-card text-card-foreground shadow-card",
    elevated: "bg-card text-card-foreground shadow-card-hover",
    interactive: "bg-card text-card-foreground shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer",
    glass: "bg-card/80 backdrop-blur-lg text-card-foreground shadow-card border-border/50"
  };
  return <div ref={ref} className={cn("rounded-xl border", variants[variant], className)} {...props} />;
});
Card.displayName = "Card";
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  className,
  ...props
}, ref) => <h3 ref={ref} className={cn("text-xl font-bold leading-none tracking-tight", className)} {...props} />);
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({
  className,
  ...props
}, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn("p-6 pt-0 px-0 py-px mx-0 my-0 opacity-90 shadow-sm", className)} {...props} />);
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />);
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };