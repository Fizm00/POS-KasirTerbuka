interface PlatformItem {
  name: string;
  type: "link" | "text" | "button";
  actionText: string;
  href?: string;
  filename?: string;
}

interface DownloadSectionProps {
  initialPlatform?: "windows" | "android" | "macos" | "linux";
}

function getDetectedPlatform(initialPlatform?: "windows" | "android" | "macos" | "linux") {
  if (initialPlatform === "android") {
    return {
      platform: "android",
      label: "Unduh untuk Android",
      versionText: "Versi 1.0.0, 48 MB",
      href: "/downloads/Kasir-Terbuka-1.0.0.apk",
      filename: "Kasir-Terbuka-1.0.0.apk",
    };
  }
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) {
      return {
        platform: "android",
        label: "Unduh untuk Android",
        versionText: "Versi 1.0.0, 48 MB",
        href: "/downloads/Kasir-Terbuka-1.0.0.apk",
        filename: "Kasir-Terbuka-1.0.0.apk",
      };
    }
    if (ua.includes("mac")) {
      return {
        platform: "macos",
        label: "Unduh untuk macOS",
        versionText: "Versi 1.0.0, 78 MB",
        href: "/downloads/Kasir-Terbuka-1.0.0.dmg",
        filename: "Kasir-Terbuka-1.0.0.dmg",
      };
    }
    if (ua.includes("linux")) {
      return {
        platform: "linux",
        label: "Unduh untuk Linux",
        versionText: "Versi 1.0.0, 82 MB",
        href: "/downloads/Kasir-Terbuka-1.0.0.AppImage",
        filename: "Kasir-Terbuka-1.0.0.AppImage",
      };
    }
  }
  return {
    platform: "windows",
    label: "Unduh untuk Windows",
    versionText: "Versi 1.0.0, 84 MB",
    href: "/downloads/Kasir-Terbuka-Setup-1.0.0.exe",
    filename: "Kasir-Terbuka-Setup-1.0.0.exe",
  };
}

export function DownloadSection({ initialPlatform }: DownloadSectionProps = {}) {
  const detected = getDetectedPlatform(initialPlatform);

  const platforms: PlatformItem[] = [
    {
      name: "Windows (.exe)",
      type: "link",
      actionText: "Unduh",
      href: "/downloads/Kasir-Terbuka-Setup-1.0.0.exe",
      filename: "Kasir-Terbuka-Setup-1.0.0.exe",
    },
    {
      name: "macOS (.dmg)",
      type: "link",
      actionText: "Unduh",
      href: "/downloads/Kasir-Terbuka-1.0.0.dmg",
      filename: "Kasir-Terbuka-1.0.0.dmg",
    },
    {
      name: "Linux (.AppImage)",
      type: "link",
      actionText: "Unduh",
      href: "/downloads/Kasir-Terbuka-1.0.0.AppImage",
      filename: "Kasir-Terbuka-1.0.0.AppImage",
    },
    {
      name: "Android (.apk)",
      type: "link",
      actionText: "Unduh",
      href: "/downloads/Kasir-Terbuka-1.0.0.apk",
      filename: "Kasir-Terbuka-1.0.0.apk",
    },
    {
      name: "iOS (.ipa)",
      type: "text",
      actionText: "Segera hadir",
    },
    {
      name: "Pasang dari browser (PWA)",
      type: "button",
      actionText: "Buka aplikasi",
      href: "/",
    },
  ];

  return (
    <section
      id="unduh"
      className="bg-[#FBFAF7] text-[#1A1A18] py-16 sm:py-24 md:py-32 border-t border-[#E6E3DA]"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <h2 className="font-serif-display font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#1A1A18] leading-[1.12] mb-8 sm:mb-10 text-left">
          Unduh Kasir Terbuka
        </h2>

        {/* Single wide panel with 1px border and 2px radius */}
        <div className="border border-[#E6E3DA] rounded-[2px] bg-white p-5 sm:p-10 text-left">
          {/* Top: Large primary button (full width 56px on mobile) + version text */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pb-8">
            <a
              href={detected.href}
              download={detected.filename}
              className="w-full sm:w-auto h-14 sm:h-[52px] px-8 rounded-lg bg-[#1F6F5C] hover:bg-[#185849] text-white font-semibold text-base inline-flex items-center justify-center transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:ring-offset-2"
            >
              {detected.label}
            </a>
            <span className="text-sm text-[#5F5E58] text-left">{detected.versionText}</span>
          </div>

          {/* Plain list of rows separated by hairlines (48px tall rows) */}
          <div className="border-t border-[#E6E3DA] divide-y divide-[#E6E3DA]">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="min-h-[48px] h-12 flex items-center justify-between text-sm"
              >
                <span className="text-[#1A1A18] font-medium text-left">{p.name}</span>

                {p.type === "link" && p.href && (
                  <a
                    href={p.href}
                    download={p.filename}
                    className="min-h-[48px] min-w-[48px] inline-flex items-center justify-end text-[#1F6F5C] hover:underline font-medium"
                  >
                    {p.actionText}
                  </a>
                )}

                {p.type === "text" && (
                  <span className="min-h-[48px] inline-flex items-center justify-end text-[#5F5E58] font-normal">
                    {p.actionText}
                  </span>
                )}

                {p.type === "button" && p.href && (
                  <a
                    href={p.href}
                    className="min-h-[48px] h-9 px-4 rounded border border-[#E6E3DA] bg-[#FBFAF7] hover:bg-white text-[#1A1A18] font-medium text-xs sm:text-sm inline-flex items-center justify-center transition-colors"
                  >
                    {p.actionText}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Under the list, one small install note */}
          <p className="mt-8 pt-4 border-t border-[#E6E3DA]/60 text-xs sm:text-sm text-[#5F5E58] leading-relaxed text-left">
            Pemasang belum ditandatangani, jadi sistem mungkin menampilkan peringatan.{" "}
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka#panduan-pemasangan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1F6F5C] hover:underline font-medium"
            >
              Lihat panduan pemasangan
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
