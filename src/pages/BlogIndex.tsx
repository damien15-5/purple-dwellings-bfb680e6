import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  published_at: string | null;
  status: string;
};

export const BlogIndex = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, author, published_at, status')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Nigerian Real Estate Blog | Guides, Tips & Market Insights"
        description="Read expert guides on buying, selling, and renting property in Nigeria. Tips on land verification, scam prevention, and market insights from Xavorian."
        path="/blog"
      />

      <div className="bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-16">
        <div className="container mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Blog' },
          ]} />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Xavorian <span className="text-primary">Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Guides, tips, and market insights for Nigerian real estate
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {posts.map((post) => (
              <article key={post.id} className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/30">Blog</span>
                </div>
                <div className="p-6 space-y-3">
                  <h2 className="text-xl font-bold text-foreground line-clamp-2">{post.title}</h2>
                  <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border">
                    {post.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.published_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
                  >
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
            <p className="text-muted-foreground mb-6">
              We're preparing expert guides on Nigerian real estate. Check back soon for articles on land verification, scam prevention, and investment tips.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/browse" className="text-primary hover:underline">Browse Properties</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/location/benin-city" className="text-primary hover:underline">Benin City Listings</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/location/lagos" className="text-primary hover:underline">Lagos Listings</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
