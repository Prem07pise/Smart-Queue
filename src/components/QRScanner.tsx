import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Upload, CheckCircle, UserCheck, AlertTriangle, Image, Loader2, Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueue, QueueItem } from '@/context/QueueContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onVerified?: (item: QueueItem) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onVerified }) => {
  const [scannedData, setScannedData] = useState<string>('');
  const [verifiedItem, setVerifiedItem] = useState<QueueItem | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const processQRDataRef = useRef<(data: string) => void>(() => {});
  const { verifyQRCode, markAsServing } = useQueue();
  const { toast } = useToast();

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error('Error getting cameras', err);
    });
  }, []);

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScannedData(e.target.value);
    setError('');
    setVerifiedItem(null);
  };

  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const processQRData = (data: string) => {
    setIsProcessing(true);
    setError('');
    setVerifiedItem(null);

    try {
      const parsedData = JSON.parse(data);
      
      if (!parsedData.queueNumber || !parsedData.phone || !parsedData.timestamp) {
        throw new Error('Invalid QR code format');
      }

      const item = verifyQRCode(parsedData);
      
      if (item) {
        playSuccessSound();
        setVerifiedItem(item);
        toast({
          title: 'Customer Verified!',
          description: `${item.name} - ${item.queueNumber}`,
          duration: 5000,
        });
        onVerified?.(item);
        // Stop camera after successful scan
        if (isCameraActive) {
          stopCamera();
        }
      } else {
        setError('Customer not found in queue or already served');
      }
    } catch (err) {
      setError('Invalid QR code data. Please try again.');
    }

    setIsProcessing(false);
  };

  useEffect(() => {
    processQRDataRef.current = processQRData;
  }, [processQRData]);

  const handleVerify = () => {
    if (!scannedData.trim()) {
      setError('Please enter QR code data');
      return;
    }
    processQRData(scannedData);
  };

  const startCamera = async (cameraId?: string) => {
    setIsCameraLoading(true);
    setError('');
    setIsCameraActive(true);

    // Wait for render to ensure element is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-camera-reader");
      }

      const cameraConfig = (cameraId || selectedCameraId) 
        ? (cameraId || selectedCameraId) 
        : { facingMode: "environment" };

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setScannedData(decodedText);
          toast({
            title: 'QR Code Detected!',
            description: 'Processing verification...',
          });
          processQRDataRef.current(decodedText);
        },
        () => {} // Ignore errors during scanning
      );

      // Refresh cameras if we don't have them yet (e.g. first time permission grant)
      if (cameras.length === 0) {
        Html5Qrcode.getCameras().then(devices => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
            if (!selectedCameraId) setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please ensure camera permissions are granted.');
      setIsCameraActive(false);
    }
    
    setIsCameraLoading(false);
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleCameraChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    
    if (isCameraActive) {
      await stopCamera();
      await new Promise(resolve => setTimeout(resolve, 200));
      startCamera(newCameraId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Stop camera if active
    if (isCameraActive) {
      await stopCamera();
    }

    setIsProcessing(true);
    setError('');
    setVerifiedItem(null);

    const imageUrl = URL.createObjectURL(file);
    setUploadedImageUrl(imageUrl);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-temp");
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      
      setScannedData(decodedText);
      
      toast({
        title: 'QR Code Detected!',
        description: 'Processing verification...',
      });

      processQRData(decodedText);
      
    } catch (err: any) {
      console.error('QR scan error:', err);
      setError('Could not detect QR code in the image. Please ensure the image is clear and contains a valid QR code.');
      setIsProcessing(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMarkAsServing = () => {
    if (verifiedItem) {
      markAsServing(verifiedItem.id);
      toast({
        title: 'Now Serving',
        description: `${verifiedItem.name} is now being served.`,
      });
      setVerifiedItem(null);
      setScannedData('');
      setUploadedImageUrl(null);
    }
  };

  const clearUploadedImage = () => {
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
    }
    setUploadedImageUrl(null);
    setScannedData('');
    setVerifiedItem(null);
    setError('');
  };

  const simulateScan = () => {
    const sampleData = JSON.stringify({
      queueNumber: 'Q001',
      phone: '5551234567',
      timestamp: Date.now() - 300000,
    });
    setScannedData(sampleData);
    processQRData(sampleData);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={toggleCamera}
          className={`flex-1 gap-2 ${isCameraActive ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
          disabled={isCameraLoading}
        >
          {isCameraLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isCameraActive ? (
            <CameraOff className="w-4 h-4" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {isCameraActive ? 'Stop Camera' : 'Live Scan'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isCameraLoading}
        >
          <Upload className="w-4 h-4" />
          Upload QR
        </Button>

        {cameras.length > 0 && (
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[200px]"
            value={selectedCameraId}
            onChange={handleCameraChange}
            disabled={isCameraLoading}
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Camera View */}
      <div 
        id="qr-camera-reader" 
        className={`rounded-xl overflow-hidden ${isCameraActive ? 'block' : 'hidden'}`}
      />

      {/* Camera Active Hint */}
      {isCameraActive && (
        <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <p className="text-sm text-primary font-medium">Point camera at QR code to scan</p>
        </div>
      )}

      {/* Manual Input */}
      {!isCameraActive && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Or paste QR code data:
          </label>
          <div className="flex gap-2">
            <Input
              value={scannedData}
              onChange={handleManualInput}
              placeholder='{"queueNumber":"Q001","phone":"5551234567","timestamp":...}'
              className="font-mono text-sm"
            />
            <Button onClick={handleVerify} disabled={isProcessing}>
              Verify
            </Button>
          </div>
        </div>
      )}

      {/* Hidden div for QR reader */}
      <div id="qr-reader-temp" style={{ display: 'none' }} />

      {/* Uploaded Image Preview */}
      {uploadedImageUrl && !isCameraActive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Uploaded Image</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearUploadedImage}>
              Clear
            </Button>
          </div>
          <div className="relative rounded-lg overflow-hidden border bg-muted/50 max-h-48 flex items-center justify-center">
            <img 
              src={uploadedImageUrl} 
              alt="Uploaded QR Code" 
              className="max-h-48 object-contain"
            />
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-6 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Scanning QR code...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Verified Customer */}
      {verifiedItem && (
        <div className="p-6 rounded-xl bg-success/10 border-2 border-success/30 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-success font-medium">Customer Verified</p>
                <p className="text-2xl font-bold text-foreground">{verifiedItem.name}</p>
              </div>
            </div>
            <StatusBadge status={verifiedItem.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-card rounded-lg">
              <p className="text-xs text-muted-foreground">Queue Number</p>
              <p className="font-mono text-xl font-bold text-primary">{verifiedItem.queueNumber}</p>
            </div>
            <div className="p-3 bg-card rounded-lg">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">XXX-XXX-{verifiedItem.phone.slice(-4)}</p>
            </div>
          </div>

          {verifiedItem.status !== 'serving' && (
            <Button
              onClick={handleMarkAsServing}
              className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground"
            >
              <UserCheck className="w-4 h-4" />
              Mark as Serving
            </Button>
          )}
        </div>
      )}
    </div>
  );
};