import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchSupportTickets } from "../../store/slices/support";
import { fetchStudentById, clearStudentDetails } from "../../store/slices/students";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Search, ChevronLeft, ChevronRight, RotateCcw, Eye, Edit, Paperclip, User, X, Clock, CheckCircle, AlertCircle, Timer, TrendingUp, Users, Calendar, MessageCircle, BarChart3, Activity, Filter, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface User {
    _id: string;
    fullName: string;
    email: string;
}

interface Message {
    sender: string;
    message: string;
    attachments: string[];
    timestamp: string;
    _id: string;
}

interface SupportTicket {
    _id: string;
    userId: User;
    subject: string;
    category: string;
    description: string;
    priority: string;
    status: string;
    messages: Message[];
    attachments: string[];
    createdAt: string;
    updatedAt: string;
}

const RequestList: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { tickets, loading, error, pagination } = useAppSelector((state) => state.support);
    const { studentDetails, loading: studentLoading } = useAppSelector((state) => state.students);
    const [searchInput, setSearchInput] = useState("");
    const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
    const [page, setPage] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [showUserTickets, setShowUserTickets] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userTicketsData, setUserTicketsData] = useState<SupportTicket[]>([]);
    const [selectedTimeRange, setSelectedTimeRange] = useState('7days');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const hasFetched = useRef(false);
    const hasAllTicketsFetched = useRef(false);

    // Fetch all tickets for analytics (once)
    useEffect(() => {
        if (!hasAllTicketsFetched.current) {
            setAnalyticsLoading(true);
            dispatch(fetchSupportTickets({ page: 1, limit: 10000 }))
                .unwrap()
                .then((response: any) => {
                    console.log('All tickets response:', response); // Debug log
                    if (response && response.tickets) {
                        setAllTickets(response.tickets);
                    } else if (response.data && response.data.tickets) {
                        setAllTickets(response.data.tickets);
                    }
                    setAnalyticsLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching all tickets:', error);
                    setAnalyticsLoading(false);
                });
            hasAllTicketsFetched.current = true;
        }
    }, [dispatch]);

    // Fetch tickets for current page display and mark viewed
    useEffect(() => {
        if (!hasFetched.current || (!isSearching && page !== pagination.page)) {
            dispatch(fetchSupportTickets({ page, limit: pagination.limit || 10 }));
            hasFetched.current = true;
        }
        const now = new Date().toISOString();
        localStorage.setItem("admin_tickets_last_viewed_at", now);
        window.dispatchEvent(new Event("tickets:viewed"));
    }, [dispatch, page, pagination.page, pagination.limit, isSearching]);

    // Handle search filtering
    useEffect(() => {
        if (searchInput.trim()) {
            setIsSearching(true);
            const searchTerm = searchInput.toLowerCase();
            const filtered = tickets.filter((ticket) => {
                return (
                    ticket.subject.toLowerCase().includes(searchTerm) ||
                    ticket.category.toLowerCase().includes(searchTerm) ||
                    ticket.description.toLowerCase().includes(searchTerm) ||
                    ticket.userId?.fullName?.toLowerCase().includes(searchTerm) ||
                    ticket.userId?.email?.toLowerCase().includes(searchTerm)
                );
            });
            setFilteredTickets(filtered);
        } else {
            setIsSearching(false);
            setFilteredTickets(tickets);
        }
    }, [tickets, searchInput]);

    const handlePageChange = (newPage: number) => {
        if (isSearching) {
            // Client-side pagination for search results
            const totalPages = Math.ceil(filteredTickets.length / (pagination.limit || 10));
            if (newPage >= 1 && newPage <= totalPages) {
                setPage(newPage);
            }
        } else {
            // Server-side pagination for all tickets
            if (newPage >= 1 && newPage <= pagination.totalPages) {
                setPage(newPage);
            }
        }
    };

    const generatePageNumbers = () => {
        const totalPages = isSearching 
            ? Math.ceil(filteredTickets.length / (pagination.limit || 10))
            : pagination.totalPages;
        
        const currentPage = isSearching ? page : pagination.page;
        const pages = [];
        const maxPages = 5;
        const start = Math.max(1, currentPage - Math.floor(maxPages / 2));
        const end = Math.min(totalPages, start + maxPages - 1);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("...");
        }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const handleSearchReset = () => {
        setSearchInput("");
        setPage(1);
        setIsSearching(false);
        dispatch(fetchSupportTickets({ page: 1, limit: pagination.limit || 10 }));
    };

    // Get current page tickets
    const getCurrentPageTickets = () => {
        if (isSearching) {
            const startIndex = (page - 1) * (pagination.limit || 10);
            const endIndex = startIndex + (pagination.limit || 10);
            return filteredTickets.slice(startIndex, endIndex);
        }
        return filteredTickets;
    };

    const handleViewUserProfile = (userId: string) => {
        dispatch(fetchStudentById(userId));
        setShowUserProfile(true);
    };

    const handleCloseUserProfile = () => {
        setShowUserProfile(false);
        dispatch(clearStudentDetails());
    };

    // Get user ticket analytics using all tickets
    const getUserTicketAnalytics = () => {
        const userStats = new Map();
        
        // Use allTickets for complete analytics, fall back to current tickets if allTickets is empty
        const ticketsToAnalyze = allTickets.length > 0 ? allTickets : tickets;
        
        ticketsToAnalyze.forEach(ticket => {
            if (ticket.userId?._id) {
                const userId = ticket.userId._id;
                const userInfo = userStats.get(userId) || {
                    id: userId,
                    name: ticket.userId.fullName,
                    email: ticket.userId.email,
                    totalTickets: 0,
                    openTickets: 0,
                    closedTickets: 0,
                    resolvedTickets: 0,
                    pendingTickets: 0,
                    highPriority: 0,
                    mediumPriority: 0,
                    lowPriority: 0,
                    lastActivity: ticket.updatedAt,
                    avgResponseTime: 0,
                    totalResponseTime: 0,
                    responseCount: 0,
                    tickets: []
                };

                userInfo.totalTickets++;
                userInfo.tickets.push(ticket);
                
                // Count by status
                if (ticket.status === 'open') userInfo.openTickets++;
                else if (ticket.status === 'closed') userInfo.closedTickets++;
                else if (ticket.status === 'resolved') userInfo.resolvedTickets++;
                else userInfo.pendingTickets++;

                // Count by priority
                if (ticket.priority === 'high') userInfo.highPriority++;
                else if (ticket.priority === 'medium') userInfo.mediumPriority++;
                else userInfo.lowPriority++;

                // Calculate response times for this user's tickets
                if (ticket.messages && ticket.messages.length > 1) {
                    for (let i = 1; i < ticket.messages.length; i++) {
                        const prevMsg = new Date(ticket.messages[i-1].timestamp);
                        const currentMsg = new Date(ticket.messages[i].timestamp);
                        const timeDiff = (currentMsg.getTime() - prevMsg.getTime()) / (1000 * 60 * 60); // hours
                        if (timeDiff > 0 && timeDiff < 168) { // Only count reasonable response times (less than 1 week)
                            userInfo.totalResponseTime += timeDiff;
                            userInfo.responseCount++;
                        }
                    }
                }

                // Calculate average response time for this user
                userInfo.avgResponseTime = userInfo.responseCount > 0 
                    ? (userInfo.totalResponseTime / userInfo.responseCount).toFixed(1) + 'h'
                    : 'No responses';

                // Update last activity if this ticket is more recent
                if (new Date(ticket.updatedAt) > new Date(userInfo.lastActivity)) {
                    userInfo.lastActivity = ticket.updatedAt;
                }

                userStats.set(userId, userInfo);
            }
        });

        return userStats;
    };

    // Memoize user analytics to prevent unnecessary recalculations
    const userAnalytics = React.useMemo(() => {
        return getUserTicketAnalytics();
    }, [allTickets, tickets]);

    const handleViewUserTickets = (userId: string) => {
        // Use allTickets for complete user ticket data
        const ticketsToFilter = allTickets.length > 0 ? allTickets : tickets;
        const userTickets = ticketsToFilter.filter(ticket => ticket.userId?._id === userId);
        setUserTicketsData(userTickets);
        setSelectedUserId(userId);
        setShowUserTickets(true);
    };

    const handleCloseUserTickets = () => {
        setShowUserTickets(false);
        setSelectedUserId(null);
        setUserTicketsData([]);
    };

    // Enhanced dashboard statistics with detailed analytics using all tickets
    const getDashboardStats = () => {
        // Use allTickets for complete analytics, fall back to current tickets if allTickets is empty
        const ticketsToAnalyze = allTickets.length > 0 ? allTickets : tickets;
        const totalTickets = ticketsToAnalyze.length;
        
        console.log('Analyzing tickets:', {
            allTicketsCount: allTickets.length,
            currentTicketsCount: tickets.length,
            usingTickets: ticketsToAnalyze.length
        }); // Debug log
        
        // Filter by time range
        const timeRangeFilter = (date: string) => {
            const ticketDate = new Date(date);
            const now = new Date();
            const days = selectedTimeRange === '7days' ? 7 : selectedTimeRange === '30days' ? 30 : 90;
            const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
            return ticketDate >= cutoff;
        };

        const recentTickets = ticketsToAnalyze.filter(ticket => timeRangeFilter(ticket.createdAt));
        
        const openTickets = ticketsToAnalyze.filter(ticket => ticket.status === 'open').length;
        const closedTickets = ticketsToAnalyze.filter(ticket => ticket.status === 'closed').length;
        const resolvedTickets = ticketsToAnalyze.filter(ticket => ticket.status === 'resolved').length;
        const pendingTickets = ticketsToAnalyze.filter(ticket => 
            ticket.status === 'pending' || 
            ticket.status === 'in-progress' ||
            (ticket.status !== 'open' && ticket.status !== 'closed' && ticket.status !== 'resolved')
        ).length;
        
        const highPriorityTickets = ticketsToAnalyze.filter(ticket => ticket.priority === 'high').length;
        const mediumPriorityTickets = ticketsToAnalyze.filter(ticket => ticket.priority === 'medium').length;
        const lowPriorityTickets = ticketsToAnalyze.filter(ticket => ticket.priority === 'low').length;
        
        // Calculate timing metrics using real data
        const calculateAvgResolveTime = () => {
            const resolvedAndClosedTickets = ticketsToAnalyze.filter(ticket => 
                ticket.status === 'resolved' || ticket.status === 'closed'
            );
            
            if (resolvedAndClosedTickets.length === 0) return 'N/A';
            
            let totalResolveTime = 0;
            let resolveCount = 0;
            
            resolvedAndClosedTickets.forEach(ticket => {
                const createdDate = new Date(ticket.createdAt);
                const updatedDate = new Date(ticket.updatedAt);
                const resolveDays = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
                
                if (resolveDays > 0 && resolveDays < 365) { // Only count reasonable resolve times
                    totalResolveTime += resolveDays;
                    resolveCount++;
                }
            });
            
            return resolveCount > 0 ? (totalResolveTime / resolveCount).toFixed(1) + ' days' : 'N/A';
        };
        
        // Get unique users and their ticket counts from all tickets
        const userTicketMap = new Map();
        ticketsToAnalyze.forEach(ticket => {
            if (ticket.userId?._id) {
                const userId = ticket.userId._id;
                const userInfo = {
                    id: userId,
                    name: ticket.userId.fullName,
                    email: ticket.userId.email,
                    count: (userTicketMap.get(userId)?.count || 0) + 1,
                    open: userTicketMap.get(userId)?.open || 0,
                    closed: userTicketMap.get(userId)?.closed || 0,
                    resolved: userTicketMap.get(userId)?.resolved || 0,
                    pending: userTicketMap.get(userId)?.pending || 0,
                    lastTicket: ticket.createdAt
                };
                
                if (ticket.status === 'open') userInfo.open++;
                else if (ticket.status === 'closed') userInfo.closed++;
                else if (ticket.status === 'resolved') userInfo.resolved++;
                else userInfo.pending++;
                
                userTicketMap.set(userId, userInfo);
            }
        });

        const uniqueUsers = userTicketMap.size;
        const topUsers = [...Array.from(userTicketMap.values())]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Recent activity from all tickets
        const recentActivity = [...ticketsToAnalyze]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        // Category breakdown from all tickets
        const categoryStats = ticketsToAnalyze.reduce((acc, ticket) => {
            const category = ticket.category === "course" ? "bug" : ticket.category;
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate messages count from all tickets
        const totalMessages = ticketsToAnalyze.reduce((acc, ticket) => acc + (ticket.messages?.length || 0), 0);
        const avgMessagesPerTicket = totalTickets > 0 ? (totalMessages / totalTickets).toFixed(1) : '0';

        // Calculate overall response times from all tickets
        const calculateResponseMetrics = () => {
            let totalResponseTime = 0;
            let responseCount = 0;
            
            ticketsToAnalyze.forEach(ticket => {
                if (ticket.messages && ticket.messages.length > 1) {
                    for (let i = 1; i < ticket.messages.length; i++) {
                        const prevMsg = new Date(ticket.messages[i-1].timestamp);
                        const currentMsg = new Date(ticket.messages[i].timestamp);
                        const timeDiff = (currentMsg.getTime() - prevMsg.getTime()) / (1000 * 60 * 60); // hours
                        if (timeDiff > 0 && timeDiff < 168) { // Only count reasonable response times
                            totalResponseTime += timeDiff;
                            responseCount++;
                        }
                    }
                }
            });
            
            return responseCount > 0 ? (totalResponseTime / responseCount).toFixed(1) + ' hours' : 'N/A';
        };

        const responseTimeMetric = calculateResponseMetrics();
        
        const stats = {
            totalTickets,
            openTickets,
            closedTickets,
            resolvedTickets,
            pendingTickets,
            highPriorityTickets,
            mediumPriorityTickets,
            lowPriorityTickets,
            avgResponseTime: responseTimeMetric,
            avgResolveTime: calculateAvgResolveTime(),
            resolutionRate: totalTickets > 0 ? Math.round(((closedTickets + resolvedTickets) / totalTickets) * 100) : 0,
            uniqueUsers,
            topUsers,
            recentActivity,
            categoryStats,
            recentTickets: recentTickets.length,
            totalMessages,
            avgMessagesPerTicket
        };
        
        console.log('Dashboard stats:', stats); // Debug log
        return stats;
    };

    // Memoize dashboard stats to prevent unnecessary recalculations
    const stats = React.useMemo(() => {
        return getDashboardStats();
    }, [allTickets, tickets, selectedTimeRange]);

    const currentTickets = getCurrentPageTickets();
    const totalTickets = isSearching ? filteredTickets.length : pagination.total;
    const currentPage = isSearching ? page : pagination.page;
    const totalPages = isSearching 
        ? Math.ceil(filteredTickets.length / (pagination.limit || 10))
        : pagination.totalPages;

    return (
        <div>
            <PageMeta title="Support Dashboard | LMS Admin" description="Comprehensive support ticket analytics" />
            <PageBreadcrumb pageTitle="Support Dashboard" />

            <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
                {/* Enhanced Dashboard Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">
                                Support Analytics Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Comprehensive overview of support operations and performance metrics
                            </p>
                            {analyticsLoading && (
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                    Loading complete analytics data...
                                </p>
                            )}
                            {!analyticsLoading && allTickets.length > 0 && (
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                    Analytics based on {allTickets.length} total tickets
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Time Range Filter */}
                           
                            <div className="text-right">
                                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {analyticsLoading ? '...' : stats.totalTickets}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Total Tickets
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Show loading indicator for analytics */}
                    {analyticsLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Main Statistics Cards Grid - only show when not loading */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                                {/* Open Tickets */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-red-600 dark:text-red-400 text-sm font-medium uppercase tracking-wide">
                                                Open Tickets
                                            </p>
                                            <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">
                                                {stats.openTickets}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className={`text-xs px-2 py-1 rounded-full ${
                                                    stats.highPriorityTickets > 0 
                                                        ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                                        : 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                    {stats.highPriorityTickets} High Priority
                                                </div>
                                                <Activity className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="mt-2 bg-red-200 dark:bg-red-800 rounded-full h-1">
                                                <div 
                                                    className="bg-red-600 h-1 rounded-full transition-all duration-300" 
                                                    style={{ width: `${(stats.openTickets / stats.totalTickets) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-lg flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Pending/In-Progress Tickets */}
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium uppercase tracking-wide">
                                                Pending
                                            </p>
                                            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">
                                                {stats.pendingTickets}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="text-xs px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    {stats.mediumPriorityTickets} Medium Priority
                                                </div>
                                                <Clock className="w-4 h-4 text-yellow-500" />
                                            </div>
                                            <div className="mt-2 bg-yellow-200 dark:bg-yellow-800 rounded-full h-1">
                                                <div 
                                                    className="bg-yellow-600 h-1 rounded-full transition-all duration-300" 
                                                    style={{ width: `${(stats.pendingTickets / stats.totalTickets) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-yellow-200 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Resolved Tickets */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-green-600 dark:text-green-400 text-sm font-medium uppercase tracking-wide">
                                                Resolved
                                            </p>
                                            <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                                                {stats.resolvedTickets}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                        {stats.resolutionRate}% Rate
                                                    </span>
                                                </div>
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            </div>
                                            <div className="mt-2 bg-green-200 dark:bg-green-800 rounded-full h-1">
                                                <div 
                                                    className="bg-green-600 h-1 rounded-full transition-all duration-300" 
                                                    style={{ width: `${stats.resolutionRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Closed Tickets */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">
                                                Closed
                                            </p>
                                            <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mt-2">
                                                {stats.closedTickets}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                                    Completed
                                                </div>
                                                <CheckCircle className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div className="mt-2 bg-gray-200 dark:bg-gray-800 rounded-full h-1">
                                                <div 
                                                    className="bg-gray-600 h-1 rounded-full transition-all duration-300" 
                                                    style={{ width: `${(stats.closedTickets / stats.totalTickets) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Active Users */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium uppercase tracking-wide">
                                                Active Users
                                            </p>
                                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                                                {stats.uniqueUsers}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="text-xs px-2 py-1 rounded-full bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {stats.avgMessagesPerTicket} Avg Messages
                                                </div>
                                                <Users className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-1">
                                                <div className="bg-blue-600 h-1 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Performance Metrics */}
                         

                            {/* Top Users and Recent Activity Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Top Users by Ticket Count */}
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                                            Top Users by Tickets
                                        </h3>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</span>
                                    </div>
                                    <div className="space-y-4">
                                        {stats.topUsers.map((user, index) => (
                                            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{user.count}</div>
                                                    <div className="flex gap-1 text-xs">
                                                        <span className="text-red-500">{user.open}O</span>
                                                        <span className="text-yellow-500">{user.pending}P</span>
                                                        <span className="text-green-500">{user.closed}C</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {stats.topUsers.length === 0 && (
                                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No user data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Activity Feed */}
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-green-600" />
                                            Recent Activity
                                        </h3>
                                        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                            View All
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {stats.recentActivity.slice(0, 8).map((ticket, index) => (
                                            <div key={ticket._id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                                <div className={`w-3 h-3 rounded-full mt-2 ${
                                                    ticket.status === 'open' ? 'bg-red-500' :
                                                    ticket.status === 'closed' ? 'bg-green-500' : 'bg-yellow-500'
                                                }`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {ticket.subject}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        by {ticket.userId?.fullName || 'Unknown'} • {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                            ticket.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                        }`}>
                                                            {ticket.priority}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-xs font-medium">
                                                            {ticket.category === "course" ? "bug" : ticket.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {stats.recentActivity.length === 0 && (
                                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category Distribution */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-purple-600" />
                                    Ticket Categories Distribution
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(stats.categoryStats).map(([category, count]) => (
                                        <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{category}</div>
                                            <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                                <div 
                                                    className="bg-purple-600 h-1 rounded-full transition-all duration-300" 
                                                    style={{ width: `${(count / stats.totalTickets) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white shadow p-4 rounded-md mb-6 dark:bg-gray-900">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by subject, category, user, or description..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                                <option value="all">All Priorities</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="pending">Pending</option>
                                <option value="closed">Closed</option>
                            </select>
                            <button
                                onClick={handleSearchReset}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-x-auto dark:bg-gray-900">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        User & Analytics
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        Priority
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        Messages
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        Created At
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
                                {currentTickets.map((ticket, idx) => {
                                    const userStats = userAnalytics.get(ticket.userId?._id);
                                    return (
                                        <tr 
                                            key={ticket._id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                            onClick={() => {
                                                if (ticket.userId?._id) {
                                                    navigate(`/students/${ticket.userId._id}`);
                                                }
                                            }}
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {isSearching 
                                                    ? (page - 1) * (pagination.limit || 10) + idx + 1
                                                    : (pagination.page - 1) * (pagination.limit || 10) + idx + 1
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {ticket.subject.length > 40
                                                    ? ticket.subject.slice(0, 40) + "..."
                                                    : ticket.subject}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{ticket.userId?.fullName || "N/A"}</div>
                                                        <div className="text-xs text-gray-400">{ticket.userId?.email}</div>
                                                        {userStats && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                                                    {userStats.totalTickets} tickets
                                                                </span>
                                                                {userStats.avgResponseTime !== 'No responses' && (
                                                                    <span className="text-xs px-1 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                                                        Avg: {userStats.avgResponseTime}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleViewUserTickets(ticket.userId._id);
                                                                    }}
                                                                    className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                                                >
                                                                    View All
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {ticket.userId?._id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/students/${ticket.userId._id}`);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-2"
                                                            title="View User Profile"
                                                        >
                                                            <User className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                {ticket.category === "course" ? "bug" : ticket.category}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    ticket.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                    ticket.status === "open" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                                    ticket.status === "closed" ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" :
                                                    ticket.status === "resolved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <MessageCircle className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{ticket.messages?.length || 0}</span>
                                                    {ticket.attachments && ticket.attachments.length > 0 && (
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <Paperclip className="w-3 h-3 text-gray-400" />
                                                            <span className="text-xs">{ticket.attachments.length}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(ticket.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/support-tickets/view/${ticket._id}`);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        title="View Ticket"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/support-tickets/edit/${ticket._id}`);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="Edit Ticket"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {currentTickets.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchInput
                                        ? "No tickets found matching your search."
                                        : "No support tickets available."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {totalTickets > 0 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing{" "}
                            {isSearching 
                                ? Math.min((page - 1) * (pagination.limit || 10) + 1, filteredTickets.length)
                                : Math.min((pagination.page - 1) * (pagination.limit || 10) + 1, pagination.total)
                            } to{" "}
                            {isSearching 
                                ? Math.min(page * (pagination.limit || 10), filteredTickets.length)
                                : Math.min(pagination.page * (pagination.limit || 10), pagination.total)
                            } of{" "}
                            {totalTickets} results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {generatePageNumbers().map((p, idx) =>
                                typeof p === "number" ? (
                                    <button
                                        key={idx}
                                        onClick={() => handlePageChange(p)}
                                        className={`px-3 py-1 rounded ${
                                            currentPage === p
                                                ? "bg-indigo-500 text-white"
                                                : "bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ) : (
                                    <span key={idx} className="px-2 text-gray-400 dark:text-gray-500">
                                        {p}
                                    </span>
                                )
                            )}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Tickets Modal */}
            {showUserTickets && selectedUserId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    All Tickets for {userTicketsData[0]?.userId?.fullName}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Total: {userTicketsData.length} tickets • {userTicketsData[0]?.userId?.email}
                                </p>
                                {userAnalytics.get(selectedUserId) && (
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                                        Average Response Time: {userAnalytics.get(selectedUserId).avgResponseTime}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleCloseUserTickets}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {/* User Ticket Analytics */}
                            {userAnalytics.get(selectedUserId) && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {userAnalytics.get(selectedUserId).totalTickets}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {userAnalytics.get(selectedUserId).openTickets}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Open</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {userAnalytics.get(selectedUserId).resolvedTickets}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Resolved</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                                            {userAnalytics.get(selectedUserId).closedTickets}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Closed</div>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {userAnalytics.get(selectedUserId).pendingTickets}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
                                    </div>
                                </div>
                            )}

                            {/* Tickets List */}
                            <div className="space-y-4">
                                {userTicketsData.map((ticket) => (
                                    <div key={ticket._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                                                    {ticket.subject}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                                    {ticket.description.length > 200 
                                                        ? ticket.description.substring(0, 200) + '...' 
                                                        : ticket.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        ticket.status === "open" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                                        ticket.status === "closed" ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" :
                                                        ticket.status === "resolved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                    }`}>
                                                        {ticket.status}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        ticket.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    }`}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-medium">
                                                        {ticket.category === "course" ? "bug" : ticket.category}
                                                    </span>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <MessageCircle className="w-3 h-3" />
                                                        {ticket.messages?.length || 0} messages
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => navigate(`/support-tickets/view/${ticket._id}`)}
                                                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                                                    title="View Ticket"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* No tickets message */}
                                {userTicketsData.length === 0 && (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No tickets found for this user.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {showUserProfile && (
                <div className="fixed inset-0 bg-transparent backdrop-blur-md   flex items-center justify-center z-[1000]">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Profile Details</h2>
                            <button
                                onClick={handleCloseUserProfile}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {studentLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                                </div>
                            ) : studentDetails ? (
                                <div className="space-y-8">
                                    {/* Profile Header */}
                                    <div className="flex items-center space-x-6">
                                        {studentDetails.profilePicture && studentDetails.profilePicture !== 'default-profile.png' ? (
                                            <img
                                                src={studentDetails.profilePicture}
                                                alt={studentDetails.fullName}
                                                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                                                <User className="w-10 h-10 text-white" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {studentDetails.fullName || studentDetails.name}
                                            </h3>
                                            <p className="text-lg text-gray-600 dark:text-gray-400">{studentDetails.email}</p>
                                            {studentDetails.phone && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">📞 {studentDetails.phone}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">Role:</span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-medium capitalize">
                                                    {studentDetails.role || 'Student'}

                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Status Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                studentDetails.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                                {studentDetails.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Account</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                studentDetails.status === 'active'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            }`}>
                                                {studentDetails.status}
                                            </span>
                                        </div>

                                       
                                    </div>

                                    {/* Restrictions Section */}
                                    {(studentDetails.isBanned || studentDetails.isShadowBanned) && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
                                                ⚠️ Account Restrictions
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {studentDetails.isBanned && (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">
                                                        🚫 Banned
                                                    </span>
                                                )}
                                                {studentDetails.isShadowBanned && (
                                                    <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-xs font-medium">
                                                        👤 Shadow Banned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Enrollment Information */}
                                    {studentDetails.enrollments && studentDetails.enrollments.length > 0 && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                📚 Course Enrollments ({studentDetails.enrollments.length})
                                            </h4>
                                            {studentDetails.enrollments.map((enrollment: any, idx: number) => (
                                                <div key={enrollment._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 last:mb-0 shadow-sm">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h5 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                                {enrollment.course?.title}
                                                            </h5>
                                                            {enrollment.course?.subtitle && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                    {enrollment.course.subtitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                   
                                                    </div>

                                                  

                                                    

                                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                                        <p><strong>Enrolled:</strong> {new Date(enrollment.createdAt).toLocaleDateString()}</p>
                                                        <p><strong>Last Updated:</strong> {new Date(enrollment.updatedAt).toLocaleDateString()}</p>
                                                        {enrollment.orderId && <p><strong>Order ID:</strong> {enrollment.orderId}</p>}
                                                       
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Additional Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Account Dates */}
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">📅 Account Timeline</h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    <strong>Created:</strong> {new Date(studentDetails.createdAt).toLocaleDateString('en-US', { 
                                                        year: 'numeric', month: 'long', day: 'numeric', 
                                                        hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </p>
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    <strong>Last Updated:</strong> {new Date(studentDetails.updatedAt).toLocaleDateString('en-US', { 
                                                        year: 'numeric', month: 'long', day: 'numeric', 
                                                        hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </p>
                                                {studentDetails.passwordChangedAt && (
                                                    <p className="text-gray-700 dark:text-gray-300">
                                                        <strong>Password Changed:</strong> {new Date(studentDetails.passwordChangedAt).toLocaleDateString('en-US', { 
                                                            year: 'numeric', month: 'long', day: 'numeric' 
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                      
                                    </div>

                                    {/* Security & Access */}
                                   

                                    {/* Action Buttons */}
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => {
                                                navigate(`/students/${studentDetails._id}`);
                                                handleCloseUserProfile();
                                            }}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        >
                                            View Full Profile
                                        </button>
                                        <button
                                            onClick={handleCloseUserProfile}
                                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="w-8 h-8 text-red-500" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400">Failed to load user profile</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Please try again later</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestList;