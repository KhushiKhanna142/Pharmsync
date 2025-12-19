import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface DrugItem {
    brand_name: string;
    generic_name: string;
    manufacturer: string;
    dosage: string;
    dosage_form: string;
    primary_ingredient: string;
}

interface DrugDatabaseTableProps {
    data: DrugItem[];
    searchTerm: string;
    onSearch: (value: string) => void;
}

export function DrugDatabaseTable({ data, searchTerm, onSearch }: DrugDatabaseTableProps) {
    const filteredData = data; // Data is already filtered by API

    return (
        <Card className="h-[600px] flex flex-col overflow-hidden">
            <div className="p-4 border-b space-y-4">
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Brand, Generic, or Manufacturer..."
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {filteredData.length} medications
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Brand Name</TableHead>
                                <TableHead>Generic Name</TableHead>
                                <TableHead>Manufacturer</TableHead>
                                <TableHead>Form</TableHead>
                                <TableHead>Ingredient</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No medications found matching "{searchTerm}"
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <TableRow key={`${item.brand_name}-${idx}`}>
                                        <TableCell className="font-medium text-primary">
                                            {item.brand_name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{item.generic_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal">
                                                {item.manufacturer || "Unknown"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.dosage_form || "-"}</TableCell>
                                        <TableCell>{item.primary_ingredient || "-"}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>
        </Card>
    );
}
