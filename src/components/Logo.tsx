import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showSubtext?: boolean;
  plain?: boolean;
  imageClassName?: string;
  hideLocationBadge?: boolean;
  inlineSubtext?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 70,
  showSubtext = false,
  plain = false,
  imageClassName = '',
  hideLocationBadge = false,
  inlineSubtext = false,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {plain ? (
        !imgError ? (
          <img
            src="/WEB_SITE_LOGO_.png"
            alt="مكتبة الرفاق"
            onError={() => setImgError(true)}
            className={imageClassName}
          />
        ) : (
          <div className={`${imageClassName} bg-[#0c1524] text-[#caa242] flex items-center justify-center font-extrabold text-sm`}>
            الرفاق
          </div>
        )
      ) : (
        <div
          style={{ width: `${size}px`, height: `${size}px` }}
          className="relative rounded-full bg-white border-2 border-[#caa242] shadow-md flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105"
        >
        {!imgError ? (
          <img
            src="/WEB_SITE_LOGO_.png"
            alt="مكتبة الرفاق"
            onError={() => setImgError(true)}
            className="w-[175%] h-[175%] max-w-none object-contain rounded-full"
          />
        ) : (
          <div className="w-full h-full bg-[#0c1524] text-[#caa242] flex items-center justify-center font-extrabold text-sm">
            الرفاق
          </div>
        )}
        </div>
      )}

      {showSubtext && (
        <div className={`${inlineSubtext ? 'flex flex-row items-center whitespace-nowrap gap-2' : 'flex flex-col items-start gap-1'} text-right leading-tight`}>
          <span className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-wide flex items-center gap-1.5">
            <span>مكتبة الرّفاق</span>
            {!hideLocationBadge && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-[#caa242] border border-[#caa242]/30">غزة</span>
            )}
          </span>
          <span className="text-xs sm:text-sm text-[#caa242] font-medium">
            للطباعة والخدمات الطلابية
          </span>
        </div>
      )}
    </div>
  );
};

