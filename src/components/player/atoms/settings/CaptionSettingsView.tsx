import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/buttons/Button";
import { Toggle } from "@/components/buttons/Toggle";
import { Dropdown } from "@/components/form/Dropdown";
import { Icon, Icons } from "@/components/Icon";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { useProgressBar } from "@/hooks/useProgressBar";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { SubtitleStyling, useSubtitleStore } from "@/stores/subtitles";

export function ColorOption(props: {
  color: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={classNames(
        "tabbable p-1.5 bg-video-context-buttonFocus rounded transition-colors duration-100",
        props.active ? "bg-opacity-100" : "bg-opacity-0 cursor-pointer",
      )}
      onClick={props.onClick}
    >
      <div
        className="w-6 h-6 rounded-full flex justify-center items-center"
        style={{ backgroundColor: props.color }}
      >
        {props.active ? (
          <Icon className="text-sm text-black" icon={Icons.CHECKMARK} />
        ) : null}
      </div>
    </button>
  );
}

export function CaptionSetting(props: {
  textTransformer?: (s: string) => string;
  value: number;
  onChange?: (val: number) => void;
  max: number;
  label: string;
  min: number;
  decimalsAllowed?: number;
  controlButtons?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const currentPercentage = (props.value - props.min) / (props.max - props.min);
  const commit = useCallback(
    (percentage: number) => {
      const range = props.max - props.min;
      const newPercentage = Math.min(Math.max(percentage, 0), 1);
      props.onChange?.(props.min + range * newPercentage);
    },
    [props],
  );

  const { dragging, dragPercentage, dragMouseDown } = useProgressBar(
    ref,
    commit,
    true,
  );

  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if (e.key === "Enter" && isFocused) {
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [isFocused]);

  const inputClasses = `tabbable py-1 bg-video-context-inputBg rounded text-white cursor-text ${
    props.controlButtons ? "text-center px-4 w-24" : "px-3 text-left w-20"
  }`;
  const arrowButtonClasses =
    "tabbable hover:text-white transition-colors duration-100 w-full h-full flex justify-center items-center hover:bg-video-context-buttonOverInputHover rounded";
  const textTransformer = props.textTransformer ?? ((s) => s);

  return (
    <div>
      <Menu.FieldTitle>{props.label}</Menu.FieldTitle>
      <div className="grid items-center grid-cols-[1fr,auto] gap-4">
        <div ref={ref}>
          <div
            className="group/progress w-full h-8 flex items-center cursor-pointer"
            onMouseDown={dragMouseDown}
            onTouchStart={dragMouseDown}
          >
            <div
              dir="ltr"
              className={[
                "relative w-full h-1 bg-video-context-slider bg-opacity-25 rounded-full transition-[height] duration-100 group-hover/progress:h-1.5",
                dragging ? "!h-1.5" : "",
              ].join(" ")}
            >
              {/* Actual progress bar */}
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-video-context-sliderFilled flex justify-end items-center"
                style={{
                  width: `${
                    Math.max(
                      0,
                      Math.min(
                        1,
                        dragging ? dragPercentage / 100 : currentPercentage,
                      ),
                    ) * 100
                  }%`,
                }}
              >
                <div
                  className={[
                    "w-[1rem] min-w-[1rem] h-[1rem] border-[4px] border-video-context-sliderFilled rounded-full transform translate-x-1/2 bg-white transition-[transform] duration-100",
                  ].join(" ")}
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          {isFocused ? (
            <input
              className={inputClasses}
              value={inputValue}
              autoFocus
              onFocus={(e) => {
                (e.target as HTMLInputElement).select();
              }}
              onBlur={(e) => {
                setIsFocused(false);
                const num = Number((e.target as HTMLInputElement).value);
                if (!Number.isNaN(num))
                  props.onChange?.(
                    (props.decimalsAllowed ?? 0) === 0 ? Math.round(num) : num,
                  );
              }}
              ref={inputRef}
              onChange={(e) =>
                setInputValue((e.target as HTMLInputElement).value)
              }
            />
          ) : (
            <div
              className="relative"
              onClick={(evt) => {
                if ((evt.target as HTMLButtonElement).closest(".actions"))
                  return;

                setInputValue(props.value.toFixed(props.decimalsAllowed ?? 0));
                setIsFocused(true);
              }}
            >
              <button
                className={classNames(
                  inputClasses,
                  props.controlButtons ? "relative" : undefined,
                )}
                type="button"
                tabIndex={0}
              >
                {textTransformer(
                  props.value.toFixed(props.decimalsAllowed ?? 0),
                )}
              </button>
              {props.controlButtons ? (
                <>
                  <div className="actions w-6 h-full absolute left-0 top-0 grid grid-cols-1 items-center justify-center">
                    <button
                      type="button"
                      onClick={
                        () =>
                          props.onChange?.(
                            props.value -
                              1 / 10 ** (props.decimalsAllowed ?? 0),
                          ) // Remove depending on the decimalsAllowed. If there's 1 decimal allowed, add 0.1. For 2, add 0.01, etc.
                      }
                      className={arrowButtonClasses}
                    >
                      <Icon icon={Icons.CHEVRON_LEFT} />
                    </button>
                  </div>
                  <div className="actions w-6 h-full absolute right-0 top-0 grid grid-cols-1 items-center justify-center">
                    <button
                      type="button"
                      onClick={
                        () =>
                          props.onChange?.(
                            props.value +
                              1 / 10 ** (props.decimalsAllowed ?? 0),
                          ) // Add depending on the decimalsAllowed. If there's 1 decimal allowed, add 0.1. For 2, add 0.01, etc.
                      }
                      className={arrowButtonClasses}
                    >
                      <Icon icon={Icons.CHEVRON_RIGHT} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const colors = ["#ffffff", "#80b1fa", "#e2e535", "#10B239FF"];

export function CaptionSettingsView({
  id,
  overlayBackLink,
}: {
  id: string;
  overlayBackLink?: boolean;
}) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const subtitleStore = useSubtitleStore();
  const preferencesStore = usePreferencesStore();
  const styling = subtitleStore.styling;
  const overrideCasing = subtitleStore.overrideCasing;
  const delay = subtitleStore.delay;
  const setOverrideCasing = subtitleStore.setOverrideCasing;
  const setDelay = subtitleStore.setDelay;
  const updateStyling = subtitleStore.updateStyling;
  const setCaptionAsTrack = usePlayerStore((s) => s.setCaptionAsTrack);
  const enableNativeSubtitles = preferencesStore.enableNativeSubtitles;

  useEffect(() => {
    subtitleStore.updateStyling(styling);
  }, [styling, subtitleStore]);

  // Sync preferences with player store
  useEffect(() => {
    setCaptionAsTrack(enableNativeSubtitles);
  }, [enableNativeSubtitles, setCaptionAsTrack]);

  const handleStylingChange = (newStyling: SubtitleStyling) => {
    updateStyling(newStyling);
  };

  const resetSubStyling = () => {
    subtitleStore.updateStyling({
      color: "#ffffff",
      backgroundOpacity: 0.5,
      size: 1,
      backgroundBlur: 0.5,
      bold: false,
      fontStyle: "default",
    });
  };

  return (
    <>
      <Menu.BackLink
        onClick={() =>
          router.navigate(overlayBackLink ? "/captionsOverlay" : "/captions")
        }
      >
        {t("player.menus.subtitles.settings.backlink")}
      </Menu.BackLink>
      <Menu.Section className="space-y-6 pb-5">
        {!enableNativeSubtitles ? (
          <>
            <div className="flex justify-between items-center">
              <Menu.FieldTitle>
                {t("player.menus.subtitles.useNativeSubtitles")}
              </Menu.FieldTitle>
              <div className="flex justify-center items-center">
                <Toggle
                  enabled={enableNativeSubtitles}
                  onClick={() =>
                    preferencesStore.setEnableNativeSubtitles(
                      !enableNativeSubtitles,
                    )
                  }
                />
              </div>
            </div>
            <span className="text-xs text-type-secondary">
              {t("player.menus.subtitles.useNativeSubtitlesDescription")}
            </span>
            <CaptionSetting
              label={t("player.menus.subtitles.settings.delay")}
              max={20}
              min={-20}
              onChange={(v) => setDelay(v)}
              value={delay}
              textTransformer={(s) => `${s}s`}
              decimalsAllowed={1}
              controlButtons
            />
            <div className="flex justify-between items-center">
              <Menu.FieldTitle>
                {t("player.menus.subtitles.settings.fixCapitals")}
              </Menu.FieldTitle>
              <div className="flex justify-center items-center">
                <Toggle
                  enabled={overrideCasing}
                  onClick={() => setOverrideCasing(!overrideCasing)}
                />
              </div>
            </div>
            <Menu.Divider />
            <CaptionSetting
              label={t("settings.subtitles.backgroundLabel")}
              max={100}
              min={0}
              onChange={(v) =>
                handleStylingChange({ ...styling, backgroundOpacity: v / 100 })
              }
              value={styling.backgroundOpacity * 100}
              textTransformer={(s) => `${s}%`}
            />
            <CaptionSetting
              label={t("settings.subtitles.backgroundBlurLabel")}
              max={100}
              min={0}
              onChange={(v) =>
                handleStylingChange({ ...styling, backgroundBlur: v / 100 })
              }
              value={styling.backgroundBlur * 100}
              textTransformer={(s) => `${s}%`}
            />
            <CaptionSetting
              label={t("settings.subtitles.textSizeLabel")}
              max={200}
              min={1}
              textTransformer={(s) => `${s}%`}
              onChange={(v) =>
                handleStylingChange({ ...styling, size: v / 100 })
              }
              value={styling.size * 100}
            />
            <div className="flex justify-between items-center">
              <Menu.FieldTitle>
                {t("settings.subtitles.textStyle.title") || "Font Style"}
              </Menu.FieldTitle>
              <Dropdown
                options={[
                  {
                    id: "default",
                    name: t("settings.subtitles.textStyle.default"),
                  },
                  {
                    id: "raised",
                    name: t("settings.subtitles.textStyle.raised"),
                  },
                  {
                    id: "depressed",
                    name: t("settings.subtitles.textStyle.depressed"),
                  },
                  {
                    id: "uniform",
                    name: t("settings.subtitles.textStyle.uniform"),
                  },
                  {
                    id: "dropShadow",
                    name: t("settings.subtitles.textStyle.dropShadow"),
                  },
                ]}
                selectedItem={{
                  id: styling.fontStyle,
                  name:
                    t(`settings.subtitles.textStyle.${styling.fontStyle}`) ||
                    styling.fontStyle,
                }}
                setSelectedItem={(item) =>
                  handleStylingChange({
                    ...styling,
                    fontStyle: item.id,
                  })
                }
              />
            </div>
            <div className="flex justify-between items-center">
              <Menu.FieldTitle>
                {t("settings.subtitles.textBoldLabel")}
              </Menu.FieldTitle>
              <div className="flex justify-center items-center">
                <Toggle
                  enabled={styling.bold}
                  onClick={() =>
                    handleStylingChange({ ...styling, bold: !styling.bold })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Menu.FieldTitle>
                {t("settings.subtitles.colorLabel")}
              </Menu.FieldTitle>
              <div className="flex justify-center items-center space-x-2">
                {colors.map((color) => (
                  <ColorOption
                    key={color}
                    color={color}
                    active={styling.color === color}
                    onClick={() => handleStylingChange({ ...styling, color })}
                  />
                ))}
                <div className="relative inline-block">
                  <input
                    type="color"
                    value={styling.color}
                    onChange={(e) => {
                      const color = e.target.value;
                      handleStylingChange({ ...styling, color });
                    }}
                    className="absolute opacity-0 cursor-pointer w-10 h-10"
                  />
                  <div style={{ color: styling.color }}>
                    <Icon icon={Icons.BRUSH} className="text-2xl" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Menu.FieldTitle>
                {t("settings.subtitles.verticalPositionLabel")}
              </Menu.FieldTitle>
              <div className="flex justify-center items-center space-x-2">
                <button
                  type="button"
                  className={classNames(
                    "px-3 py-1 rounded transition-colors duration-100",
                    styling.verticalPosition === 3
                      ? "bg-video-context-buttonFocus"
                      : "bg-video-context-buttonFocus bg-opacity-0 hover:bg-opacity-50",
                  )}
                  onClick={() =>
                    handleStylingChange({
                      ...styling,
                      verticalPosition: 3,
                    })
                  }
                >
                  {t("settings.subtitles.default")}
                </button>
                <button
                  type="button"
                  className={classNames(
                    "px-3 py-1 rounded transition-colors duration-100",
                    styling.verticalPosition === 1
                      ? "bg-video-context-buttonFocus"
                      : "bg-video-context-buttonFocus bg-opacity-0 hover:bg-opacity-50",
                  )}
                  onClick={() =>
                    handleStylingChange({
                      ...styling,
                      verticalPosition: 1,
                    })
                  }
                >
                  {t("settings.subtitles.low")}
                </button>
              </div>
            </div>
            <Button
              className="w-full md:w-auto"
              theme="secondary"
              onClick={resetSubStyling}
            >
              {t("settings.reset")}
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <Menu.FieldTitle>
                {t(
                  "player.menus.subtitles.settings.useNativeSubtitles",
                  "Use native video subtitles",
                )}
              </Menu.FieldTitle>
              <div className="flex justify-center items-center">
                <Toggle
                  enabled={enableNativeSubtitles}
                  onClick={() =>
                    preferencesStore.setEnableNativeSubtitles(
                      !enableNativeSubtitles,
                    )
                  }
                />
              </div>
            </div>
            <span className="text-xs text-type-secondary">
              {t("player.menus.subtitles.useNativeSubtitlesDescription")}
            </span>
          </>
        )}
      </Menu.Section>
    </>
  );
}
