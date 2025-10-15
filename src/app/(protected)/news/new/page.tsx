import ArticleForm from '../_components/ArticleForm';

export default async function NewArticlePage() {

  const serverArticle = {
    status: 'DRAFT' as const,
    title: '',
    excerpt: '',
    content: '',
    seoTitle: null as string | null,
    seoDescription: null as string | null,
    coverId: null as string | null,
    coverUrl: null as string | null,
    date: null as string | null, 
    slug: null as string | null,
  };

  return <ArticleForm serverArticle={serverArticle} />;
}
