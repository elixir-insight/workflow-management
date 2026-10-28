export function pageTitleForPath(pathname: string) {
	if (pathname.startsWith('/timesheet')) return 'Timesheet';
	if (pathname.startsWith('/attendance/approvals')) return 'Approvals';
	if (pathname.startsWith('/attendance/leave')) return 'Apply leave';
	if (pathname.startsWith('/attendance/wfh')) return 'WFH request';
	if (pathname.startsWith('/attendance')) return 'Attendance';
	if (pathname.startsWith('/profile')) return 'My profile';
	if (pathname.startsWith('/admin/users')) return 'User management';
	if (pathname.startsWith('/admin')) return 'Dashboard';
	if (pathname.startsWith('/payroll')) return 'Dashboard';
	if (pathname.startsWith('/user')) return 'Dashboard';
	return 'Home';
}
