import { SheetHeader } from "./SheetHeader";

export type ProbabilityProtocol = "bottles" | "coins" | "dice";

const bottleCategories = ["Röd", "Gul", "Vit", "Totalt"];
const bottleLabels = ["Resultat", "Andel", "%", "Sannolikhet"];

function ProtocolTable({
  categories,
  compact = false,
}: {
  categories: string[];
  compact?: boolean;
}) {
  return (
    <table className={`probability-table${compact ? " probability-table--compact" : ""}`}>
      <thead>
        <tr>
          <th scope="col"></th>
          {categories.map((category) => (
            <th scope="col" key={category}>
              {category}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bottleLabels.map((label) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            {categories.map((category) => (
              <td key={category}></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BottleProtocol() {
  return (
    <div className="probability-bottles">
      {Array.from({ length: 8 }, (_, index) => (
        <section className="probability-experiment" key={index}>
          <h3>Skaka flaska {String.fromCharCode(65 + index)}</h3>
          <ProtocolTable categories={bottleCategories} compact />
        </section>
      ))}
    </div>
  );
}

function CoinProtocol() {
  return (
    <div className="probability-pair">
      <section className="probability-experiment">
        <h3>Kasta ett mynt</h3>
        <ProtocolTable categories={["Krona", "Klave", "Totalt"]} />
      </section>
      <section className="probability-experiment">
        <h3>Kasta två mynt</h3>
        <ProtocolTable categories={["Krona–krona", "Krona–klave", "Klave–klave", "Totalt"]} />
      </section>
    </div>
  );
}

function DiceProtocol() {
  return (
    <div className="probability-dice">
      <section className="probability-experiment">
        <h3>Slå en tärning</h3>
        <ProtocolTable categories={["1", "2", "3", "4", "5", "6", "Totalt"]} />
      </section>
      <section className="probability-experiment">
        <h3>Slå två tärningar · summan</h3>
        <ProtocolTable
          categories={["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Totalt"]}
          compact
        />
      </section>
    </div>
  );
}

export function SheetProbability({ protocol }: { protocol: ProbabilityProtocol }) {
  const title = protocol === "bottles" ? "Flaskor" : protocol === "coins" ? "Mynt" : "Tärningar";
  return (
    <div className="a4-page landscape probability-page">
      <SheetHeader title="Sannolikhet och statistik" subtitle={title} score=" " />
      <p className="probability-instruction">
        Genomför försöken. Fyll i resultat, andel, procent och sannolikhet.
      </p>
      {protocol === "bottles" ? (
        <BottleProtocol />
      ) : protocol === "coins" ? (
        <CoinProtocol />
      ) : (
        <DiceProtocol />
      )}
    </div>
  );
}
