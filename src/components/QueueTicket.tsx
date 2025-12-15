import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Eye, Clock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueueItem } from '@/context/QueueContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QueueTicketProps {
  item: QueueItem;
  onViewStatus: () => void;
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const maskPhone = (phone: string): string => {
  if (phone.length >= 10) {
    return `XXX-XXX-${phone.slice(-4)}`;
  }
  return phone;
};

export const QueueTicket: React.FC<QueueTicketProps> = ({ item, onViewStatus }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      // Prefer canvas if available (canvas contains a locked high-res rendering)
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Create PDF and lay out QR image + text details
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a6' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 8;

      // place QR centered and large
      const qrDisplaySizeMm = 70; // mm
      const qrX = (pdfWidth - qrDisplaySizeMm) / 2;
      pdf.addImage(imgData, 'PNG', qrX, margin, qrDisplaySizeMm, qrDisplaySizeMm);

      // Add ticket details under the QR
      const startY = margin + qrDisplaySizeMm + 6;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Queue: ${item.queueNumber}`, margin, startY);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Name: ${item.name}`, margin, startY + 7);
      pdf.text(`Phone: ${item.phone}`, margin, startY + 14);
      pdf.text(`Position: #${item.position}`, margin, startY + 21);
      pdf.text(`Est. Wait: ~${item.estimatedWait} min`, margin, startY + 28);
      pdf.text(`Joined: ${formatTime(item.joinedAt)}`, margin, startY + 35);

      pdf.save(`SmartQueue-Ticket-${item.queueNumber}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  const qrData = JSON.stringify({
    queueNumber: item.queueNumber,
    phone: item.phone,
    timestamp: item.joinedAt,
  });

  // Draw SVG into canvas once (and whenever qrData changes)
  React.useEffect(() => {
    const draw = async () => {
      try {
        if (!qrRef.current || !canvasRef.current) return;
        const svgEl = qrRef.current.querySelector('svg');
        if (!svgEl) return;

        const svgString = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = url;
        });

        const canvas = canvasRef.current;
        // high resolution backing store
        const size = 1200;
        canvas.width = size;
        canvas.height = size;
        // visible size (CSS) for layout
        canvas.style.width = '220px';
        canvas.style.height = '220px';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // padding to create a clean frame
        const padding = Math.round(size * 0.06);
        ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

        // draw subtle outer frame
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = Math.round(size * 0.006);
        ctx.strokeRect(padding / 2, padding / 2, size - padding, size - padding);

        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Canvas draw failed:', err);
      }
    };
    draw();
  }, [qrData]);

  return (
    <div className="animate-slide-up">
      {/* Printable Ticket */}
      <div
        ref={ticketRef}
        className="ticket-print bg-ticket border-2 border-ticket-border rounded-xl p-6 max-w-sm mx-auto shadow-lg"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-muted-foreground/30 pb-4 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">SMARTQUEUE</h1>
          <p className="text-sm text-muted-foreground">Digital Queue System</p>
        </div>

        {/* Queue Number */}
        <div className="text-center py-6 bg-secondary/50 rounded-lg mb-4">
          <p className="text-sm text-muted-foreground mb-1">Queue Number</p>
          <p className="font-mono text-5xl font-bold text-primary tracking-wider">
            {item.queueNumber}
          </p>
        </div>

        {/* Position and Wait Time */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Position</p>
            <p className="text-2xl font-bold text-foreground">#{item.position}</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Est. Wait</p>
            <p className="text-2xl font-bold text-foreground">~{item.estimatedWait}min</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium text-foreground">{item.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium text-foreground">{maskPhone(item.phone)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium text-foreground">{formatTime(item.joinedAt)}</span>
          </div>
        </div>

        {/* QR Code rendered to a locked canvas for a clean frame */}
        <div className="flex flex-col items-center py-4 bg-secondary/30 rounded-lg mb-4">
          <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
          {/* hidden svg used as source for canvas rendering */}
          <div ref={qrRef} style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden>
            <QRCodeSVG value={qrData} size={400} level="H" includeMargin />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Scan to verify</p>
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-muted-foreground border-t-2 border-dashed border-muted-foreground/30 pt-4">
          <p className="mb-1">Show this ticket when called</p>
          <p>Scan QR code to verify identity</p>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-muted">
          <p className="text-xs text-muted-foreground">
            Thank you for using SmartQueue
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 max-w-sm mx-auto no-print">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Ticket
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>
      <div className="mt-3 max-w-sm mx-auto no-print">
        <Button
          onClick={onViewStatus}
          className="w-full gap-2 bg-primary hover:bg-primary/90"
        >
          <Eye className="w-4 h-4" />
          View Live Status
        </Button>
      </div>
    </div>
  );
};
