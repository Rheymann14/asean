import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reports', href: '/reports' }];

type Summary = {
    total_registered_participants: number;
    total_participants_attended: number;
    total_participants_did_not_join: number;
};

type ReportRow = {
    id: number;
    display_id: string | null;
    name: string;
    email: string;
    country_name: string | null;
    has_attended: boolean;
};

type PageProps = {
    summary: Summary;
    rows: ReportRow[];
};

const PER_PAGE = 10;

export default function Reports({ summary, rows }: PageProps) {
    const [search, setSearch] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);

    const filteredRows = React.useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return rows;

        return rows.filter((row) =>
            [row.display_id ?? '', row.name, row.email, row.country_name ?? '', row.has_attended ? 'attended' : 'did not join']
                .join(' ')
                .toLowerCase()
                .includes(keyword),
        );
    }, [rows, search]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedRows = React.useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reports</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Total Registered Participants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summary.total_registered_participants.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Total Participants Attended
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summary.total_participants_attended.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Total Participants Did Not Join
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summary.total_participants_did_not_join.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Participants Report</CardTitle>
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by ID, name, email, country, or status"
                            className="w-full md:w-80"
                        />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRows.length ? (
                                        paginatedRows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.display_id ?? '-'}</TableCell>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.email}</TableCell>
                                                <TableCell>{row.country_name ?? '-'}</TableCell>
                                                <TableCell>{row.has_attended ? 'Attended' : 'Did Not Join'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-slate-500">
                                                No participants found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-600 md:flex-row dark:text-slate-300">
                            <p>
                                Showing {(currentPage - 1) * PER_PAGE + (paginatedRows.length ? 1 : 0)} to{' '}
                                {(currentPage - 1) * PER_PAGE + paginatedRows.length} of {filteredRows.length} entries
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                >
                                    Previous
                                </Button>
                                <span>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
