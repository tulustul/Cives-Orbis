import { TechDefChanneled, TechKnowledgeChanneled } from "@/shared";
import styles from "./TechTree.module.css";
import { useRef } from "react";
import { techBlockHeight, techBlockWidth } from "./const";

type Props = {
  techs: TechKnowledgeChanneled[];
};

type Point = { x: number; y: number };

type Link = {
  fromTech: string;
  toTech: string;
  from: Point;
  to: Point;
  midPointX: number;
};

const radius = 30;

export function TechLinks({ techs }: Props) {
  const elRef = useRef<HTMLDivElement>(null);

  const techsMap = new Map<string, TechDefChanneled>();
  techs.forEach((tech) => techsMap.set(tech.def.id, tech.def));

  const links = techs.flatMap((tech) =>
    Object.entries(tech.def.layout.linksMiddlePoint).map((item) => {
      const nextTech = techsMap.get(item[0])!;
      const midPointX = item[1];

      return {
        fromTech: tech.def.id,
        toTech: nextTech.id,
        from: {
          x: tech.def.layout.x + techBlockWidth,
          y: tech.def.layout.y + techBlockHeight / 2,
        },
        to: {
          x: nextTech.layout.x - 5,
          y: nextTech.layout.y + techBlockHeight / 2,
        },
        midPointX,
      } as Link;
    }),
  );

  return (
    <div ref={elRef} className={styles.techLinks}>
      <svg
        className="w-[13500px] h-full"
        style={{
          filter: "drop-shadow(0 0 6px #ddd)",
        }}
      >
        {links.map((link, index) => (
          <Link key={index} link={link} />
        ))}
      </svg>
    </div>
  );
}

function Link({ link }: { link: Link }) {
  const arrowD = `M ${link.to.x} ${link.to.y} l -10 -8 l 0 16 Z`;

  const midPoint = (link.from.x + link.to.x) / 2;
  // if (link.midPointX) {
  //   midPoint += link.midPointX;
  // }

  let upOrDown = link.from.y < link.to.y ? 1 : -1;
  if (link.from.y === link.to.y) {
    upOrDown = 0;
  }

  const r = Math.min(radius, Math.abs(link.from.y - link.to.y) / 2);

  const linkD =
    `M ${link.from.x} ${link.from.y} ` +
    `L ${midPoint - r} ${link.from.y} ` +
    (upOrDown === 1 ? `q ${r} 0 ${r} ${r} ` : "") +
    (upOrDown === -1 ? `q ${r} 0 ${r} -${r} ` : "") +
    `L ${midPoint} ${link.to.y + -r * upOrDown} ` +
    (upOrDown === 1 ? `q 0 ${r} ${r} ${r} ` : "") +
    (upOrDown === -1 ? `q 0 -${r} ${r} -${r} ` : "") +
    `L ${link.to.x - 10} ${link.to.y}`;

  return (
    <>
      <path
        d={arrowD}
        fill="#583c01"
        stroke="none"
        data-link-from={link.fromTech}
        data-link-to={link.toTech}
      />
      <path
        className="shadow"
        d={linkD}
        stroke="#583c01"
        strokeWidth={4}
        fill="none"
        data-link-from={link.fromTech}
        data-link-to={link.toTech}
      />
    </>
  );
}
