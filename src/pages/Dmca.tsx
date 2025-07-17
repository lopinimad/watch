import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon, Icons } from "@/components/Icon";
import { ThinContainer } from "@/components/layout/ThinContainer";
import { Heading1, Paragraph } from "@/components/utils/Text";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { conf } from "@/setup/config";

import { SubPageLayout } from "./layouts/SubPageLayout";

export function shouldHaveDmcaPage() {
  return !!conf().DMCA_EMAIL;
}

export function DmcaPage() {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SubPageLayout>
      <PageTitle subpage k="global.pages.dmca" />
      <ThinContainer>
        <Heading1>{t("screens.dmca.title")}</Heading1>
        <h1 className="pt-0 text-gray-500 text-xl">
          This site operates in compliance with the Digital Millennium Copyright
          Act (&ldquo;DMCA&ldquo;). We do not store any files on our servers.
          All videos and media content are hosted on third-party services.
          Please remember that we do not host or manage the content.
          <br />
          <br />
          For questions or concerns, feel free to contact us!
        </h1>
        <Paragraph className="mt-2 text-gray-500 text-sm">
          (The{" "}
          <a href="/about" className="text-type-link">
            about
          </a>{" "}
          page has more information about how we get our content.)
        </Paragraph>
        <Paragraph className="flex space-x-3 items-center">
          <Icon icon={Icons.MAIL} />
          <a
            href={`mailto:${conf().DMCA_EMAIL}`}
            style={{
              transition: "color 0.3s ease",
              color: isHovered ? "#ffffff" : "inherit",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {conf().DMCA_EMAIL ?? ""}
          </a>
        </Paragraph>
      </ThinContainer>
    </SubPageLayout>
  );
}
