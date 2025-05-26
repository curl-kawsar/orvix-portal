import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Invoice from "@/models/Invoice";
import Expense from "@/models/Expense";
import User from "@/models/User";
import Client from "@/models/Client";
import { authenticate } from "@/lib/auth";
import { getCachedData } from "@/lib/cache";

export async function GET(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Check if we should skip the cache
    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get('skipCache') === 'true';
    
    // Cache key includes user ID to make cache user-specific
    const userId = auth.user.id;
    const cacheKeyPrefix = `dashboard-${userId}`;
    
    // Helper function that conditionally uses cache
    const getData = async (cacheKey, dataFn, ttl) => {
      if (skipCache) {
        return await dataFn();
      }
      return await getCachedData(cacheKey, dataFn, ttl);
    };
    
    // Get project statistics with caching
    const projectsCount = await getData(
      `${cacheKeyPrefix}-projects-count`,
      () => Project.countDocuments()
    );
    
    const activeProjects = await getData(
      `${cacheKeyPrefix}-active-projects`,
      () => Project.countDocuments({ status: 'in-progress' })
    );
    
    const completedProjects = await getData(
      `${cacheKeyPrefix}-completed-projects`,
      () => Project.countDocuments({ status: 'completed' })
    );
    
    const onHoldProjects = await getData(
      `${cacheKeyPrefix}-onhold-projects`,
      () => Project.countDocuments({ status: 'on-hold' })
    );
    
    // Get task statistics with caching
    const tasksCount = await getData(
      `${cacheKeyPrefix}-tasks-count`,
      () => Task.countDocuments()
    );
    
    const todoTasks = await getData(
      `${cacheKeyPrefix}-todo-tasks`,
      () => Task.countDocuments({ status: 'todo' })
    );
    
    const inProgressTasks = await getData(
      `${cacheKeyPrefix}-inprogress-tasks`,
      () => Task.countDocuments({ status: 'in-progress' })
    );
    
    const reviewTasks = await getData(
      `${cacheKeyPrefix}-review-tasks`,
      () => Task.countDocuments({ status: 'review' })
    );
    
    const doneTasks = await getData(
      `${cacheKeyPrefix}-done-tasks`,
      () => Task.countDocuments({ status: 'done' })
    );
    
    // Get revenue data
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    // Cache invoice data
    const paidInvoicesThisMonth = await getData(
      `${cacheKeyPrefix}-invoices-thismonth`,
      () => Invoice.find({
        status: 'paid',
        paymentDate: { $gte: firstDayOfMonth, $lte: currentDate }
      })
    );
    
    const paidInvoicesLastMonth = await getData(
      `${cacheKeyPrefix}-invoices-lastmonth`,
      () => Invoice.find({
        status: 'paid',
        paymentDate: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth }
      })
    );
    
    const outstandingInvoices = await getData(
      `${cacheKeyPrefix}-invoices-outstanding`,
      () => Invoice.find({
        status: { $in: ['sent', 'overdue'] }
      })
    );
    
    const thisMonthRevenue = paidInvoicesThisMonth.reduce((sum, invoice) => sum + invoice.total, 0);
    const lastMonthRevenue = paidInvoicesLastMonth.reduce((sum, invoice) => sum + invoice.total, 0);
    const outstanding = outstandingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Get team data with caching
    const usersCount = await getData(
      `${cacheKeyPrefix}-users-count`,
      () => User.countDocuments({ isActive: true })
    );
    
    // Get upcoming deadlines with caching
    const upcomingDeadlines = await getData(
      `${cacheKeyPrefix}-deadlines`,
      () => Project.find({
        deadline: { $gte: new Date(), $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        status: { $in: ['planning', 'in-progress', 'review'] }
      })
      .populate('client', 'name')
      .limit(5)
      .sort({ deadline: 1 })
      .select('name client deadline status')
    );
    
    // Get recent activities with caching (shorter TTL for more up-to-date activity)
    const recentActivities = await getData(
      `${cacheKeyPrefix}-activities`,
      () => Task.find()
        .populate('assignee', 'name')
        .populate('createdBy', 'name')
        .populate('project', 'name')
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title assignee createdBy project updatedAt status'),
      120 // 2 minute cache for activities
    );

    // Format the recent activities
    const formattedActivities = recentActivities.map(task => {
      const action = task.status === 'done' ? 'completed task' : 
                    task.status === 'in-progress' ? 'started working on' :
                    task.status === 'review' ? 'submitted for review' : 'updated';
      
      // Use assignee if available, otherwise fall back to createdBy, or finally "System" as the last resort
      const userName = (task.assignee && task.assignee.name) 
                     ? task.assignee.name 
                     : (task.createdBy && task.createdBy.name) 
                       ? task.createdBy.name 
                       : "System";
      
      return {
        id: task._id,
        user: userName,
        action,
        target: task.title,
        project: task.project ? task.project.name : 'Unknown Project',
        time: task.updatedAt
      };
    });

    // Calculate team utilization 
    // In a real app, this would be based on time entries or task allocations
    // Here we'll use a simple calculation based on tasks in progress vs total capacity
    const teamUtilization = usersCount > 0 ? 
      Math.min(100, Math.round((inProgressTasks / (usersCount * 3)) * 100)) : 0;

    // Format deadlines for response
    const formattedDeadlines = upcomingDeadlines.map(project => ({
      id: project._id,
      name: project.name,
      client: project.client ? project.client.name : 'Unknown Client',
      deadline: project.deadline,
      status: project.status
    }));
    
    const dashboardData = {
      projects: {
        total: projectsCount,
        active: activeProjects,
        completed: completedProjects,
        onHold: onHoldProjects,
      },
      tasks: {
        total: tasksCount,
        todo: todoTasks,
        inProgress: inProgressTasks,
        review: reviewTasks,
        completed: doneTasks,
      },
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        outstanding: outstanding,
      },
      team: {
        total: usersCount,
        utilization: teamUtilization,
        overallocated: inProgressTasks > (usersCount * 3) ? Math.ceil((inProgressTasks - (usersCount * 3)) / 3) : 0,
      },
      upcomingDeadlines: formattedDeadlines,
      recentActivities: formattedActivities,
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { message: "Error fetching dashboard data", error: error.message },
      { status: 500 }
    );
  }
} 