import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Invoice from "@/models/Invoice";
import Expense from "@/models/Expense";
import User from "@/models/User";
import { authenticate } from "@/lib/auth";

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
    
    // Get project statistics
    const projectsCount = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'in-progress' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const onHoldProjects = await Project.countDocuments({ status: 'on-hold' });
    
    // Get task statistics
    const tasksCount = await Task.countDocuments();
    const todoTasks = await Task.countDocuments({ status: 'todo' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const reviewTasks = await Task.countDocuments({ status: 'review' });
    const doneTasks = await Task.countDocuments({ status: 'done' });
    
    // Get revenue data
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    const paidInvoicesThisMonth = await Invoice.find({
      status: 'paid',
      paymentDate: { $gte: firstDayOfMonth, $lte: currentDate }
    });
    
    const paidInvoicesLastMonth = await Invoice.find({
      status: 'paid',
      paymentDate: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth }
    });
    
    const outstandingInvoices = await Invoice.find({
      status: { $in: ['sent', 'overdue'] }
    });
    
    const thisMonthRevenue = paidInvoicesThisMonth.reduce((sum, invoice) => sum + invoice.total, 0);
    const lastMonthRevenue = paidInvoicesLastMonth.reduce((sum, invoice) => sum + invoice.total, 0);
    const outstanding = outstandingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Get team data
    const usersCount = await User.countDocuments({ isActive: true });
    
    // Get upcoming deadlines
    const upcomingDeadlines = await Project.find({
      deadline: { $gte: new Date(), $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      status: { $in: ['planning', 'in-progress', 'review'] }
    })
    .populate('client', 'name')
    .limit(5)
    .sort({ deadline: 1 })
    .select('name client deadline status');
    
    // Get recent activities (this is more complex in real app, would involve activity logging)
    // For demo, we'll use recent tasks that were updated
    const recentActivities = await Task.find()
      .populate('assignee', 'name')
      .populate('createdBy', 'name')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title assignee createdBy project updatedAt status');

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