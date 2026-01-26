"use client";

import { getBaseUrl } from "@/utils/url";
import Link from "next/link";
import * as React from "react";

const URL_REGEX =
    /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function linkifyText(text: string) {
    const result: React.ReactNode[] = [];

    let lastIndex = 0;

    text.replace(URL_REGEX, (match, _group, offset) => {
        if (offset > lastIndex) {
            result.push(text.slice(lastIndex, offset));
        }

        const href = match.startsWith("http")
            ? match
            : `https://${match}`;

        const isInternal = href.includes(getBaseUrl());
        const url = isInternal ? href.replace(getBaseUrl(), "") : href;

        let displayText = match;

        if (url.startsWith("/tickets/")) {
            displayText = url.replace("/tickets/", "Ticket: #");
        }

        const handleClick = (event: React.MouseEvent) => {
            if (isInternal) return;
            if (!confirm("Are you sure you want to leave this page?")) {
                event.preventDefault();
            }
        };

        result.push(
            <Link
                key={`${offset}-${match}`}
                href={url}
                onClick={handleClick}
                className="underline"
            >
                {displayText}
            </Link>
        );

        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

type ContentProps = {
  children: string;
};

const Content = ({ children }: ContentProps) => {
  return (
    <p className="whitespace-pre-line">
      {linkifyText(children)}
    </p>
  );
};

export { Content };
