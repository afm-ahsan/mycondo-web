import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileUploadListItem } from './file-upload';

describe('FileUploadListItem', () => {
  it('renders an image as a clickable thumbnail preview', () => {
    render(
      <FileUploadListItem
        fileName="photo.jpg"
        status="uploaded"
        previewUrl="blob:mock-object-url"
        isImage
      />,
    );

    const preview = screen.getByRole('link', { name: /preview photo\.jpg/i });
    expect(preview).toHaveAttribute('href', 'blob:mock-object-url');
    expect(preview.querySelector('img')).toBeInTheDocument();
  });

  it('renders a "View" link for a non-image file with a preview URL, without a thumbnail', () => {
    render(
      <FileUploadListItem fileName="deed.pdf" status="uploaded" previewUrl="blob:mock-object-url" isImage={false} />,
    );

    const viewLink = screen.getByRole('link', { name: /view/i });
    expect(viewLink).toHaveAttribute('href', 'blob:mock-object-url');
    expect(screen.queryByRole('link', { name: /preview deed\.pdf/i })).not.toBeInTheDocument();
  });

  it('shows no preview affordance when previewUrl is not yet available', () => {
    render(<FileUploadListItem fileName="deed.pdf" status="uploading" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
