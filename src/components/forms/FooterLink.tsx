import Link from 'next/link';

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
  return (
    <div className="pt-4 text-center">
      <p className="text-sm text-gray-500">
        {text}
        <Link href={href} className="footer-link ml-2">
          {linkText}
        </Link>
      </p>
    </div>
  );
};

export default FooterLink;
