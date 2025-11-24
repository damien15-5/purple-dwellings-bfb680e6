import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Blog = () => {
  const posts = [
    {
      title: '5 Red Flags to Watch for When Buying Property',
      excerpt: 'Learn how to identify potential fraud and avoid common pitfalls in real estate transactions.',
      author: 'Xavorian Team',
      date: 'January 15, 2025',
      category: 'Buyer Tips',
      image: '/placeholder.svg',
    },
    {
      title: 'How AI is Transforming Real Estate Verification',
      excerpt: 'Discover how artificial intelligence is making property transactions safer and more efficient.',
      author: 'Tech Team',
      date: 'January 10, 2025',
      category: 'Technology',
      image: '/placeholder.svg',
    },
    {
      title: 'Understanding Escrow: A Complete Guide',
      excerpt: 'Everything you need to know about secure escrow services and how they protect your transaction.',
      author: 'Legal Team',
      date: 'January 5, 2025',
      category: 'Education',
      image: '/placeholder.svg',
    },
    {
      title: 'Top 10 Mistakes First-Time Home Buyers Make',
      excerpt: 'Avoid these common mistakes and make your first property purchase a success.',
      author: 'Xavorian Team',
      date: 'December 28, 2024',
      category: 'Buyer Tips',
      image: '/placeholder.svg',
    },
    {
      title: 'The Future of Real Estate in Africa',
      excerpt: 'Exploring trends, opportunities, and challenges in the African real estate market.',
      author: 'Market Analysis',
      date: 'December 20, 2024',
      category: 'Market Trends',
      image: '/placeholder.svg',
    },
    {
      title: 'How to Prepare Your Property for Sale',
      excerpt: 'Maximize your property value with these proven preparation and staging tips.',
      author: 'Seller Guide',
      date: 'December 15, 2024',
      category: 'Seller Tips',
      image: '/placeholder.svg',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Xavorian <span className="text-gradient-primary">Blog</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Insights, tips, and news from the world of real estate
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <article
                key={index}
                className="bg-white rounded-xl overflow-hidden border-2 border-light-purple-border hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/30">Blog</span>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-block bg-light-purple-accent/20 text-light-purple-accent px-3 py-1 rounded-full font-semibold">
                      {post.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Full blog article coming soon!')}
                    className="inline-flex items-center gap-2 text-light-purple-accent font-semibold hover:gap-3 transition-all cursor-pointer"
                  >
                    Read More <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6">
              Want to stay updated with our latest articles?
            </p>
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-2 border-light-purple-border focus:border-light-purple-accent focus:outline-none"
              />
              <button className="bg-gradient-to-r from-primary to-accent-purple text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
