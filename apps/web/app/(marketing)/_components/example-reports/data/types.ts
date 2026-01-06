export interface ExampleReport {
  id: string;
  category: string;
  categoryColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  title: string;
  subtitle: string;
  pages: number;
  patents: number;
  papers: number;
  readTime: string;
  slug: string;
}

export interface ReportSection {
  id: string;
  title: string;
}
