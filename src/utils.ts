import CliTable from "cli-table";

export const tableLog = (data: any[] | any) => {
  if (!data || data.length === 0) return;
  if (!(data instanceof Array)) {
    data = [data];
  }
  const head = Object.keys(data[0]);
  const colWidths = head.map((h) => {
    if (head === data) {
      return 30;
    } else {
      return 15;
    }
  });
  const table = new CliTable({ head, colWidths });

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
