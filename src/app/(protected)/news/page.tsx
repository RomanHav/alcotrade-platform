import NewsTable from './_components/NewsTable';

export default function NewsPage() {
  return (
    <div className="px-8 pt-16">
      <div className="mb-9 flex items-center justify-between">
        <h1 className="text-4xl font-semibold">Новини</h1>
      </div>
      <NewsTable />
    </div>
  );
}
