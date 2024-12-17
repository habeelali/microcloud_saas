"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditPortDialog } from "./edit-port-dialog";
import { DeletePortDialog } from "./delete-port-dialog";

const initialPorts = [
  {
    id: "1",
    port: "80",
    protocol: "TCP",
    description: "Web Server",
    status: "Active",
  },
  {
    id: "2",
    port: "443",
    protocol: "TCP",
    description: "SSL Web Server",
    status: "Active",
  },
  {
    id: "3",
    port: "22",
    protocol: "TCP",
    description: "SSH Access",
    status: "Active",
  },
];

export function PortMappingsTable() {
  const [ports] = useState(initialPorts);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Port</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ports.map((port) => (
            <TableRow key={port.id}>
              <TableCell className="font-mono">{port.port}</TableCell>
              <TableCell>{port.protocol}</TableCell>
              <TableCell>{port.description}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500">
                  {port.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <EditPortDialog port={port} />
                  <DeletePortDialog port={port} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}