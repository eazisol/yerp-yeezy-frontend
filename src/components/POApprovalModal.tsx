import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, PenTool } from "lucide-react";
import { fileUploadService } from "@/services/fileUpload";
import { useToast } from "@/hooks/use-toast";

interface POApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (isApproved: boolean, comment?: string, signatureUrl?: string) => Promise<void>;
  isApproving: boolean;
}

export default function POApprovalModal({
  open,
  onOpenChange,
  onApprove,
  isApproving,
}: POApprovalModalProps) {
  const [comment, setComment] = useState("");
  const [signature, setSignature] = useState<string | null>(null); // Base64 for preview
  const [signatureFilePath, setSignatureFilePath] = useState<string | null>(null); // File path after upload
  const [isDrawing, setIsDrawing] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const isMouseDownRef = useRef(false);
  const { toast } = useToast();

  const handleStartDrawing = () => {
    setIsDrawingMode(true);
    setIsDrawing(false); // Don't start drawing until mouseDown
    isMouseDownRef.current = false; // Reset mouse state
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    e.preventDefault(); // Prevent default behavior
    isMouseDownRef.current = true;
    setIsDrawing(true); // Start drawing
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only draw if mouse button is actually pressed (mouseDown was called)
    if (!isDrawing || !isMouseDownRef.current || !canvasRef.current) return;
    e.preventDefault(); // Prevent default behavior
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return; // Only process if mouse was actually down
    isMouseDownRef.current = false;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setSignature(dataUrl);
    }
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setSignature(null);
    setIsDrawingMode(false);
  };

  const clearCanvasOnly = () => {
    // Clear only the canvas, keep drawing mode active
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setSignature(null);
    setIsDrawing(false); // Reset drawing state so next draw works properly
    isMouseDownRef.current = false; // Reset mouse down state
    // Don't change isDrawingMode - keep it active so user can draw again
  };

  // Convert base64 to File
  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleApprove = async (isApproved: boolean) => {
    try {
      let filePath: string | undefined = undefined;

      // If signature exists, upload it first
      if (signature) {
        setIsUploadingSignature(true);
        try {
          const file = base64ToFile(signature, `signature-${Date.now()}.png`);
          const uploadResponse = await fileUploadService.uploadPOSignature(file);
          filePath = uploadResponse.filePath;
          setSignatureFilePath(filePath);
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to upload signature",
            variant: "destructive",
          });
          setIsUploadingSignature(false);
          return; // Don't proceed if signature upload fails
        } finally {
          setIsUploadingSignature(false);
        }
      }

      // Call onApprove with file path instead of base64
      await onApprove(isApproved, comment || undefined, filePath);
      
      // Reset form
      setComment("");
      clearSignature();
      setSignature(null);
      setSignatureFilePath(null);
      setIsDrawingMode(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process approval",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setComment("");
    clearSignature();
    setSignature(null);
    setIsDrawingMode(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve or Reject Purchase Order</DialogTitle>
          <DialogDescription>
            Please provide your approval decision along with any comments and signature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Enter your comments here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Signature Section */}
          <div className="space-y-2">
            <Label>Signature</Label>
            <div className="border rounded-lg p-4 bg-white">
              {!isDrawingMode && !signature && (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                  <PenTool className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Click below to sign</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleStartDrawing}
                    disabled={isApproving}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Start Drawing Signature
                  </Button>
                </div>
              )}

              {isDrawingMode && (
                <div className="space-y-2">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="border rounded cursor-crosshair w-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearCanvasOnly}
                      disabled={isApproving}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDrawingMode(false);
                        if (canvasRef.current) {
                          const dataUrl = canvasRef.current.toDataURL();
                          setSignature(dataUrl);
                        }
                      }}
                      disabled={isApproving}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}

              {signature && !isDrawingMode && (
                <div className="space-y-2">
                  <img
                    src={signature}
                    alt="Signature"
                    className="border rounded max-w-full h-auto"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearSignature();
                        setSignatureFilePath(null);
                        handleStartDrawing();
                      }}
                      disabled={isApproving || isUploadingSignature}
                    >
                      Re-sign
                    </Button>
                    {isUploadingSignature && (
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading signature...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isApproving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleApprove(false)}
            disabled={isApproving || isUploadingSignature}
          >
            {isApproving || isUploadingSignature ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploadingSignature ? "Uploading..." : "Rejecting..."}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={() => handleApprove(true)}
            disabled={isApproving || isUploadingSignature}
          >
            {isApproving || isUploadingSignature ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploadingSignature ? "Uploading..." : "Approving..."}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

