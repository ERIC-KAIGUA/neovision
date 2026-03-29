interface TestimonialCardProps {
  quote: string;
  author: string;
}

export const TestimonialCard = ({quote , author}: TestimonialCardProps) => {


  return (
    <div className="min-w-[320px] max-w-sm bg-shade rounded-2xl p-4 shadow-lg gap-2 mt-3">
        <p className="font-body text-wrap">{quote}</p>
        <p className="font-tertiary text-sm mt-2">— {author}</p>
    </div>
  )
}
