import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Package, Plus, Eye } from 'lucide-react';

export default function ProductCatalogPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><Package size={22} className="text-primary-600"/>Product Catalog</h1>
          <p className="page-subtitle">Products and services offered by registered MSMEs</p></div>
      </div>

      <div className="card p-16 text-center">
        <Package size={56} className="text-muted-foreground/30 mx-auto mb-4"/>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">Product Catalog</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Browse and search products and services offered by registered MSMEs. Navigate to an MSME profile to view and manage their products.</p>
        <Link href="/msmes"><a className="btn-primary mt-6 inline-flex gap-1.5"><Eye size={14}/>Browse MSMEs</a></Link>
      </div>
    </div>
  );
}
