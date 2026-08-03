import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogPosts';
import bakeryImage from '../assets/bakery-interior.webp';
import aboutImage from '../assets/gerti-foods-about-us.webp';
import pieImage from '../assets/products/Pie.webp';

const images = { bakery: bakeryImage, about: aboutImage, pie: pieImage };

export default function Blog() {
  const { lang, t } = useLanguage();

  return (
    <div className="blog-page">
      <SEO title={t('blog_title')} description={t('blog_meta')} />
      <header className="blog-hero">
        <span>{t('blog_eyebrow')}</span>
        <h1>{t('blog_title')}</h1>
        <p>{t('blog_intro')}</p>
      </header>
      <section className="blog-grid" aria-label={t('blog_latest')}>
        {blogPosts.map((post, index) => {
          const content = post.translations[lang] || post.translations.sq;
          return (
            <article className={`blog-card${index === 0 ? ' blog-card-featured' : ''}`} key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="blog-card-image">
                <img src={images[post.image]} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
              </Link>
              <div className="blog-card-content">
                <div className="blog-meta"><span>{content.category}</span><time dateTime={post.published}>{post.published}</time><span>{content.readingTime}</span></div>
                <h2><Link to={`/blog/${post.slug}`}>{content.title}</Link></h2>
                <p>{content.description}</p>
                <Link to={`/blog/${post.slug}`} className="blog-read-more">{t('blog_read_more')} →</Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
