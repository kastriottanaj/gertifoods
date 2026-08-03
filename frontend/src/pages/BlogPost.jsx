import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import { getBlogPost } from '../data/blogPosts';
import bakeryImage from '../assets/bakery-interior.webp';
import aboutImage from '../assets/gerti-foods-about-us.webp';
import pieImage from '../assets/products/Pie.webp';

const images = { bakery: bakeryImage, about: aboutImage, pie: pieImage };

export default function BlogPost() {
  const { slug } = useParams();
  const { lang, t } = useLanguage();
  const post = getBlogPost(slug);

  if (!post) return <div className="blog-not-found"><h1>{t('blog_not_found')}</h1><Link to="/blog">← {t('blog_back')}</Link></div>;

  const content = post.translations[lang] || post.translations.sq;
  const canonical = `https://gertifoods.com/blog/${post.slug}`;
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: content.title, description: content.description,
    datePublished: post.published, dateModified: post.published,
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Gerti Foods' },
    publisher: { '@type': 'Organization', name: 'Gerti Foods', url: 'https://gertifoods.com/' },
  };

  return (
    <article className="blog-article">
      <SEO title={content.title} description={content.description} />
      <Helmet><script type="application/ld+json">{JSON.stringify(schema)}</script></Helmet>
      <nav className="blog-breadcrumb"><Link to="/blog">{t('blog_title')}</Link> / <span>{content.category}</span></nav>
      <header className="blog-article-header">
        <div className="blog-meta"><span>{content.category}</span><time dateTime={post.published}>{post.published}</time><span>{content.readingTime}</span></div>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
      </header>
      <img className="blog-article-hero" src={images[post.image]} alt="" fetchPriority="high" />
      <div className="blog-article-body">
        {content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
        <aside><h2>{t('blog_cta_title')}</h2><p>{t('blog_cta_body')}</p><Link to="/products" className="btn btn-primary">{t('areas_cta_products')}</Link></aside>
      </div>
      <Link to="/blog" className="blog-back">← {t('blog_back')}</Link>
    </article>
  );
}
