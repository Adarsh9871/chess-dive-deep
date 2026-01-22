import { Crown } from "lucide-react";

const footerLinks = {
  Play: ["Play Kids", "Play Bots", "Tournaments", "Puzzles"],
  Learn: ["Lessons", "Videos", "Articles", "Chess Terms"],
  Parents: ["About Us", "Safety", "Pricing", "Schools"],
  Support: ["Help Center", "Contact", "Privacy", "Terms"],
};

const Footer = () => {
  return (
    <footer className="bg-foreground text-card py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-gold" />
              <span className="text-xl font-display font-bold">
                Chess<span className="text-primary">Pals</span>
              </span>
            </a>
            <p className="text-card/70 text-sm font-nunito">
              The #1 chess site for kids. Learn, play, and have fun!
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-bold mb-4 text-gold">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-card/70 hover:text-card text-sm font-nunito transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-card/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-card/50 text-sm font-nunito">
            © 2024 ChessPals. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-2xl">♔</span>
            <span className="text-2xl">♕</span>
            <span className="text-2xl">♗</span>
            <span className="text-2xl">♘</span>
            <span className="text-2xl">♖</span>
            <span className="text-2xl">♙</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
