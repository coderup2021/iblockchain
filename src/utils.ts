import CliTable from "cli-table";

export const tableLog = (data: any[] | any) => {
  if (!(data instanceof Array)) {
    data = [data];
  }
  const head = Object.keys(data[0]);
  const table = new CliTable({
    head,
    colWidths: new Array(head.length).fill(15),
  });

  const tableRows = data.map((d) =>
    head.map((h) => JSON.stringify(d[h], null, 1))
  );

  tableRows.forEach(function (item) {
    table.push(item);
  });
  console.log(table.toString());
};

export const jsonLog = (data: any) => {
  console.log(JSON.stringify(data, null, 2));
};
