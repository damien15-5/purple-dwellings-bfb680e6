import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  published_at: string | null;
};

export const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedProperties, setRelatedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (data) {
        setPost(data as Post);
        // Fetch related properties
        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'published')
          .limit(3);
        setRelatedProperties(props || []);
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Link to="/blog" className="text-primary hover:underline">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Xavorian',
      url: 'https://www.xavorian.xyz',
    },
    datePublished: post.published_at,
    url: `https://www.xavorian.xyz/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <BreadcrumbNav items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]} />

        <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
        </Link>

        <article>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            {post.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.published_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="prose prose-lg max-w-none text-foreground">
            {post.content.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </article>

        {/* Internal Links */}
        <div className="mt-12 pt-8 border-t border-border space-y-4">
          <h3 className="font-semibold">Explore More</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/location/benin-city" className="text-primary hover:underline text-sm">Benin City Properties</Link>
            <Link to="/location/lagos" className="text-primary hover:underline text-sm">Lagos Properties</Link>
            <Link to="/browse" className="text-primary hover:underline text-sm">All Listings</Link>
            <Link to="/agents" className="text-primary hover:underline text-sm">Find Agents</Link>
          </div>
        </div>

        {/* Related Listings */}
        {relatedProperties.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={{
                    id: p.id,
                    title: p.title,
                    location: p.address,
                    price: p.price,
                    bedrooms: p.bedrooms || 0,
                    bathrooms: p.bathrooms || 0,
                    sqft: p.area || 0,
                    propertyType: p.property_type || 'House',
                    images: p.images || ['/placeholder.svg'],
                    description: p.description,
                    seller: { id: 1, name: 'Seller' },
                    status: p.status || 'published',
                    isVerified: p.is_verified,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
