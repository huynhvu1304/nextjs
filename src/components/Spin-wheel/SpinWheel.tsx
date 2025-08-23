'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SpinWheelService, SpinEligibilityResponse, SpinResult, SpinWheelVoucher } from '../../service/spinWheel.service';
import { toast } from 'react-toastify';
import './SpinWheel.css';
import { IoCloseCircleOutline } from 'react-icons/io5';

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];

const SpinWheel: React.FC<SpinWheelProps> = ({ isOpen, onClose }) => {
  const [eligibility, setEligibility] = useState<SpinEligibilityResponse | null>(null);
  const [wheelItems, setWheelItems] = useState<SpinWheelVoucher[]>([]);
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const pendingResultRef = useRef<SpinResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSpinning(false);
      setShowResult(false);
      setSpinResult(null);
      setRotation((r) => r % 360); 
    }
  }, [isOpen]);

  
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [elig, vouchersResp] = await Promise.all([
          SpinWheelService.checkEligibility(),
          SpinWheelService.getSpinWheelVouchers(),
        ]);
        setEligibility(elig);
        setWheelItems(vouchersResp.vouchers || []);
        if (!elig.canSpin && typeof elig.remainingTime === 'number') {
          setCountdown(elig.remainingTime);
        } else {
          setCountdown(null);
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Không thể tải dữ liệu vòng quay');
      }
    };

    loadData();
  }, [isOpen]);


  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      
      (async () => {
        try {
          const elig = await SpinWheelService.checkEligibility();
          setEligibility(elig);
          setCountdown(elig.canSpin ? null : (elig.remainingTime ?? null));
        } catch {}
      })();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : Math.max(0, c - 1))), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const anglePerSegment = useMemo(() => {
    return wheelItems.length > 0 ? 360 / wheelItems.length : 0;
  }, [wheelItems.length]);

  const buildWheelGradient = (count: number) => {
    if (count <= 0) return undefined;
    const step = 360 / count;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const start = (i * step).toFixed(3);
      const end = ((i + 1) * step).toFixed(3);
      const color = COLORS[i % COLORS.length];
      parts.push(`${color} ${start}deg ${end}deg`);
    }
    return `conic-gradient(${parts.join(',')})`;
  };

  const getDiscountText = (v: SpinWheelVoucher) => {
    if (v.isNoPrize || v.code === 'NO_PRIZE') {
      return (
        <>
          Chúc bạn may <br />
          mắn lần sau !
        </>
      );
    }
    return v.discountType === 'percent'
      ? `${v.discountValue}%`
      : `${formatCurrency(v.discountValue)}`;
  };


  const formatCurrency = (amount: number) => {
    try {
      return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    } catch {
      return `${amount}₫`;
    }
  };

  const formatDate = (iso?: string | Date) => {
    if (!iso) return '';
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    try {
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const renderWheelSegments = () => {
    if (wheelItems.length === 0) return null;
    const clsSize =
      wheelItems.length <= 6 ? 'wheel-segment-large' : wheelItems.length <= 8 ? 'wheel-segment-medium' : 'wheel-segment-small';
    return wheelItems.map((v, i) => {
      const rotate = i * anglePerSegment;
      const isNoPrize = v.isNoPrize || v.code === 'NO_PRIZE';
      return (
        <div
          key={v._id}
          className={`wheel-segment ${clsSize}${isNoPrize ? ' no-prize-segment' : ''}`}
          style={{ transform: `rotate(${rotate}deg)` }}
        >
          <div className="segment-content">
            <div className={`discount-text${isNoPrize ? ' no-prize-text' : ''}`}>
              {getDiscountText(v)}
            </div>
          </div>
        </div>
      );
    });
  };

  const handleSpin = async () => {
    if (!eligibility?.canSpin) return;
    if (wheelItems.length === 0) return toast.info('Chưa có voucher để quay');
    if (isSpinning) return;

    try {
      setIsSpinning(true);
      setShowResult(false);
      const result = await SpinWheelService.spinWheel();
      pendingResultRef.current = result;

     
      let targetIndex = 0;
      const targetCode = result.voucher?.code ?? 'NO_PRIZE';
      const idx = wheelItems.findIndex((v) => v.code === targetCode);
      targetIndex = idx >= 0 ? idx : 0;

      const centerAngle = targetIndex * anglePerSegment + anglePerSegment / 2;
      const normalizedPrev = ((rotation % 360) + 360) % 360;
     
      const jitter = Math.max(5, anglePerSegment * 0.2);
      const offset = (Math.random() - 0.5) * Math.min(jitter, anglePerSegment * 0.8);
     
      const pointerAngle = 350;
      const desiredAtPointer = (360 - ((centerAngle - pointerAngle) + offset) + 360) % 360;
      let deltaToFinal = desiredAtPointer - normalizedPrev;
      if (deltaToFinal < 0) deltaToFinal += 360;
      const fullSpins = 6 * 360;
      const finalRotation = rotation + fullSpins + deltaToFinal;

      const onTransitionEnd = () => {
      
        if (wheelRef.current) {
          wheelRef.current.removeEventListener('transitionend', onTransitionEnd);
        }
        setIsSpinning(false);
        const r = pendingResultRef.current;
        setSpinResult(r || null);
        setShowResult(true);
       
        if (r?.voucher) {
          setWheelItems((items) =>
            items.map((it) =>
              it.code === r.voucher.code ? { ...it, remaining: r.voucher.remaining } : it
            )
          );
        }
       
        (async () => {
          try {
            const elig = await SpinWheelService.checkEligibility();
            setEligibility(elig);
            setCountdown(elig.canSpin ? null : (elig.remainingTime ?? null));
          } catch {}
        })();
      };

      if (wheelRef.current) {
        wheelRef.current.addEventListener('transitionend', onTransitionEnd, { once: true } as any);
      }

      
      if (wheelRef.current) void wheelRef.current.offsetHeight;
      setRotation(finalRotation);
    } catch (err: any) {
    if (err.message !== "Unauthorized") {
      toast.error(err?.message || "Không thể quay lúc này");
    }
    setIsSpinning(false);
  }
  };

  if (!isOpen) return null;

  return (
    <div className="spin-wheel-overlay">
      <div className="spin-wheel-modal">
        <div className="spin-wheel-header">
          <h2>Vòng Quay May Mắn</h2>
          <button className="close-button" onClick={onClose}><IoCloseCircleOutline /></button>
        </div>

        <div className="spin-wheel-content">
          {!showResult ? (
            <>
              <div className="eligibility-info">
                {eligibility && (
                  <div className={`eligibility-message ${eligibility.canSpin ? 'can-spin' : 'cannot-spin'}`}>
                    {eligibility.message}
                    {!eligibility.canSpin && countdown !== null && (
                      <div className="remaining-time countdown">
                        ⏰Còn lại: {formatCountdown(countdown)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="wheel-container">
                <div
                  ref={wheelRef}
                  className="wheel"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    background: buildWheelGradient(wheelItems.length),
                  }}
                >
                  {renderWheelSegments()}
                </div>
                <div className="wheel-pointer"></div>
              </div>

              <button
                className={`spin-button ${!eligibility?.canSpin || isSpinning || wheelItems.length === 0 ? 'disabled' : ''}`}
                onClick={handleSpin}
                disabled={!eligibility?.canSpin || isSpinning || wheelItems.length === 0}
              >
                {isSpinning ? 'Đang quay...' : wheelItems.length === 0 ? 'Chưa có voucher' : 'Quay Ngay!'}
              </button>
            </>
          ) : (
            <div className="result-container">
              {spinResult && (
                <>
                  <div className="result-icon">{spinResult.spinResult === 'no_prize' ? '😭' : '🎉'}</div>
                  <h3 className="result-title">
                    {spinResult.message}
                  </h3>
                  {spinResult.voucher && (
                    <div className="voucher-details">
                      {/* <div className="voucher-code">
                        <strong>Mã Voucher:</strong> {spinResult.voucher.code}
                      </div> */}
                      {/* <div className="voucher-description">
                        <strong>Mô tả:</strong> {spinResult.voucher.description}
                      </div> */}
                      <div className="voucher-discount">
                        <strong>Giảm giá:</strong> {getDiscountText(spinResult.voucher as any)}
                      </div>
                      {spinResult.voucher.minOrderValue > 0 && (
                        <div className="voucher-min-order">
                          <strong>Đơn tối thiểu:</strong> {formatCurrency(spinResult.voucher.minOrderValue)}
                        </div>
                      )}
                      {spinResult.voucher.maxDiscountValue > 0 && (
                        <div className="voucher-min-order">
                          <strong>Giảm tối đa:</strong> {formatCurrency(spinResult.voucher.maxDiscountValue)}
                        </div>
                      )}
                      <div className="voucher-expiry">
                        <strong>Hết hạn:</strong> {formatDate(spinResult.voucher.endDate)}
                      </div>
                      {/* <div className="voucher-remaining">
                        <strong>Còn lại:</strong> {spinResult.voucher.remaining} voucher
                      </div> */}
                    </div>
                  )}
                  <div className="result-note">
                    {spinResult.spinResult === 'no_prize'
                      ? '😔 Rất tiếc, bạn chưa trúng thưởng lần này. Hãy thử lại vào lần sau nhé!'
                      : '💡 Voucher đã được thêm vào kho voucher của bạn. Bạn có thể xem trong trang thông tin cá nhân.'}
                  </div>
                </>
              )}
              <div className="result-actions">
                <button className="spin-again-button" onClick={() => setShowResult(false)}>
                  Quay Lại
                </button>
                <button className="close-result-button" onClick={onClose}>
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;