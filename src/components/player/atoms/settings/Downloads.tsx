import { Listbox } from "@headlessui/react";
import { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCopyToClipboard } from "react-use";

import { Button } from "@/components/buttons/Button";
import { OptionItem } from "@/components/form/Dropdown";
import { Icon, Icons } from "@/components/Icon";
import { OverlayPage } from "@/components/overlays/OverlayPage";
import { Menu } from "@/components/player/internals/ContextMenu";
import { convertSubtitlesToSrtDataurl } from "@/components/player/utils/captions";
import { Transition } from "@/components/utils/Transition";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";

function PlayerDropdown({
  options,
  onSelectOption,
}: {
  options: OptionItem[];
  onSelectOption: (option: OptionItem) => void;
}) {
  const { t } = useTranslation();
  const defaultLabel = t("player.menus.downloads.openIn");

  return (
    <div className="relative w-full mb-3">
      <Listbox onChange={onSelectOption}>
        {({ open }) => (
          <>
            <Listbox.Button className="relative z-[101] w-full rounded-lg bg-dropdown-background hover:bg-dropdown-hoverBackground py-3 pl-3 pr-10 text-left text-white shadow-md focus:outline-none tabbable cursor-pointer">
              <span className="flex gap-4 items-center truncate">
                {defaultLabel}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <Icon
                  icon={Icons.UP_DOWN_ARROW}
                  className="transform transition-transform text-xl text-dropdown-secondary rotate-180"
                />
              </span>
            </Listbox.Button>
            <Transition
              animation="slide-down"
              show={open}
              className="absolute z-[102] bottom-full mb-1 w-full max-h-60 overflow-auto rounded-lg bg-dropdown-background py-1 text-white shadow-lg ring-1 ring-black ring-opacity-5 scrollbar-thin scrollbar-track-background-secondary scrollbar-thumb-type-secondary focus:outline-none"
            >
              <Listbox.Options static className="py-1">
                {options.map((opt) => (
                  <Listbox.Option
                    className={({ active }) =>
                      `cursor-pointer flex gap-4 items-center relative select-none py-2 px-4 mx-1 rounded-lg ${
                        active
                          ? "bg-background-secondaryHover text-type-link"
                          : "text-type-secondary"
                      }`
                    }
                    key={opt.id}
                    value={opt}
                  >
                    {opt.leftIcon ? opt.leftIcon : null}
                    {opt.name}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  );
}

export function useDownloadLink() {
  const source = usePlayerStore((s) => s.source);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const url = useMemo(() => {
    if (source?.type === "file" && currentQuality)
      return source.qualities[currentQuality]?.url ?? null;
    if (source?.type === "hls") return source.url;
    return null;
  }, [source, currentQuality]);
  return url;
}

function StyleTrans(props: { k: string }) {
  return (
    <Trans
      i18nKey={props.k}
      components={{
        bold: <Menu.Highlight />,
        br: <br />,
        ios_share: (
          <Icon icon={Icons.IOS_SHARE} className="inline-block text-xl -mb-1" />
        ),
        ios_files: (
          <Icon icon={Icons.IOS_FILES} className="inline-block text-xl -mb-1" />
        ),
      }}
    />
  );
}

export function DownloadView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();
  const downloadUrl = useDownloadLink();

  // Custom function to process the download URL
  const processDownloadUrl = useCallback(() => {
    if (!downloadUrl) return "";

    // Check if the URL contains the m3u8-proxy and the ?url= parameter
    const match = downloadUrl.match(/m3u8-proxy\?url=(.*)$/);
    if (match && match[1]) {
      // Decode the URL component
      return decodeURIComponent(match[1]);
    }

    return downloadUrl; // Return original if no specific pattern is found
  }, [downloadUrl]);

  const hlsDownload = `https://hls-downloader.pstream.org/?url=${encodeURIComponent(processDownloadUrl())}`;
  const [, copyToClipboard] = useCopyToClipboard();

  const sourceType = usePlayerStore((s) => s.source?.type);
  const selectedCaption = usePlayerStore((s) => s.caption?.selected);
  const openSubtitleDownload = useCallback(() => {
    const dataUrl = selectedCaption
      ? convertSubtitlesToSrtDataurl(selectedCaption?.srtData)
      : null;
    if (!dataUrl) return;
    window.open(dataUrl);
  }, [selectedCaption]);

  const playerOptions = useMemo(
    () => [
      { id: "vlc", name: t("player.menus.downloads.vlc") },
      { id: "iina", name: t("player.menus.downloads.iina") },
      { id: "outplayer", name: t("player.menus.downloads.outplayer") },
    ],
    [t],
  );

  const openInExternalPlayer = useCallback(
    (option: OptionItem) => {
      if (!downloadUrl) return;

      let externalUrl = "";

      switch (option.id) {
        case "vlc":
          externalUrl = `vlc://${downloadUrl}`;
          break;
        case "iina":
          externalUrl = `iina://weblink?url=${encodeURIComponent(downloadUrl)}`;
          break;
        case "outplayer":
          externalUrl = `outplayer://${downloadUrl}`;
          break;
        default:
          break;
      }

      if (externalUrl) {
        window.open(externalUrl);
      }
    },
    [downloadUrl],
  );

  if (!downloadUrl) return null;

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>
        {t("player.menus.downloads.title")}
      </Menu.BackLink>
      <Menu.Section>
        <div className="mb-4">
          {sourceType === "hls" ? (
            <div className="mb-6">
              <Menu.Paragraph marginClass="mb-6">
                <StyleTrans k="player.menus.downloads.hlsDisclaimer" />
              </Menu.Paragraph>

              <PlayerDropdown
                options={playerOptions}
                onSelectOption={openInExternalPlayer}
              />
              <p className="text-xs pb-4 text-type-danger">
                <Trans i18nKey="player.menus.downloads.hlsOpenInDisclaimer" />
              </p>

              <Button className="w-full mt-2" theme="purple" href={hlsDownload}>
                {t("player.menus.downloads.button")}
              </Button>
              <p className="text-xs py-4">
                <Trans i18nKey="player.menus.downloads.hlsDownloader">
                  <a
                    className="text-type-link"
                    href="https://hls-downloader.pstream.org/"
                  />
                </Trans>
              </p>
              <Button
                className="w-full mt-2"
                theme="secondary"
                href={downloadUrl}
                onClick={(event) => {
                  // Allow context menu & left click to copy
                  event.preventDefault();

                  copyToClipboard(downloadUrl);
                }}
              >
                {t("player.menus.downloads.copyHlsPlaylist")}
              </Button>
              <Button
                className="w-full mt-2"
                onClick={openSubtitleDownload}
                disabled={!selectedCaption}
                theme="secondary"
              >
                {t("player.menus.downloads.downloadSubtitle")}
              </Button>
            </div>
          ) : (
            <>
              <Menu.ChevronLink onClick={() => router.navigate("/download/pc")}>
                {t("player.menus.downloads.onPc.title")}
              </Menu.ChevronLink>
              <Menu.ChevronLink
                onClick={() => router.navigate("/download/ios")}
              >
                {t("player.menus.downloads.onIos.title")}
              </Menu.ChevronLink>
              <Menu.ChevronLink
                onClick={() => router.navigate("/download/android")}
              >
                {t("player.menus.downloads.onAndroid.title")}
              </Menu.ChevronLink>

              <Menu.Divider />

              <Menu.Paragraph marginClass="my-6">
                <StyleTrans k="player.menus.downloads.disclaimer" />
              </Menu.Paragraph>

              <PlayerDropdown
                options={playerOptions}
                onSelectOption={openInExternalPlayer}
              />

              <Button className="w-full" href={downloadUrl} theme="purple">
                {t("player.menus.downloads.downloadVideo")}
              </Button>
              <Button
                className="w-full mt-2"
                onClick={openSubtitleDownload}
                disabled={!selectedCaption}
                theme="secondary"
                download="subtitles.srt"
              >
                {t("player.menus.downloads.downloadSubtitle")}
              </Button>
            </>
          )}
        </div>
      </Menu.Section>
    </>
  );
}

function AndroidExplanationView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download")}>
        {t("player.menus.downloads.onAndroid.shortTitle")}
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph>
          <StyleTrans k="player.menus.downloads.onAndroid.1" />
        </Menu.Paragraph>
      </Menu.Section>
    </>
  );
}

function PCExplanationView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download")}>
        {t("player.menus.downloads.onPc.shortTitle")}
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph>
          <StyleTrans k="player.menus.downloads.onPc.1" />
        </Menu.Paragraph>
      </Menu.Section>
    </>
  );
}

function IOSExplanationView({ id }: { id: string }) {
  const router = useOverlayRouter(id);

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download")}>
        <StyleTrans k="player.menus.downloads.onIos.shortTitle" />
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph>
          <StyleTrans k="player.menus.downloads.onIos.1" />
        </Menu.Paragraph>
      </Menu.Section>
    </>
  );
}

export function DownloadRoutes({ id }: { id: string }) {
  return (
    <>
      <OverlayPage id={id} path="/download" width={343} height={490}>
        <Menu.CardWithScrollable>
          <DownloadView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/ios" width={343} height={440}>
        <Menu.CardWithScrollable>
          <IOSExplanationView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/android" width={343} height={440}>
        <Menu.CardWithScrollable>
          <AndroidExplanationView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/pc" width={343} height={440}>
        <Menu.CardWithScrollable>
          <PCExplanationView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
    </>
  );
}
