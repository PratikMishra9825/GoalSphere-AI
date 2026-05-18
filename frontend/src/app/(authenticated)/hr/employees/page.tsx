"use client";

import { useState, useEffect } from "react";
import { Users, Search, Filter, MoreHorizontal, CheckCircle2, Plus, Edit2, Trash2, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal Control States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Form Inputs State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("Engineering");
  const [designation, setDesignation] = useState("Frontend Engineer");
  const [selectedManager, setSelectedManager] = useState("");

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${getBackendUrl()}/api/actions/messages/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter possible managers from users
  const managerList = employees.filter(emp => emp.role === "manager");

  const openEditModal = (emp: any) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setRole(emp.role);
    setDepartment(emp.department || "Engineering");
    setDesignation(emp.designation || "Frontend Engineer");
    setSelectedManager(emp.manager || "");
    setShowEditModal(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/actions/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department,
          designation,
          manager: selectedManager || undefined
        })
      });

      if (res.ok) {
        toast.success("Employee Registered", {
          description: `${name} has been successfully added to organization MongoDB database.`,
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
        setShowAddModal(false);
        // Reset Inputs
        setName("");
        setEmail("");
        setPassword("");
        setRole("employee");
        setDepartment("Engineering");
        setDesignation("Frontend Engineer");
        setSelectedManager("");
        fetchEmployees();
      } else {
        const data = await res.json();
        toast.error("Registration Failed", { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network connection error");
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/actions/employees/${editingEmployee._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          role,
          department,
          designation,
          manager: selectedManager || undefined
        })
      });

      if (res.ok) {
        toast.success("Profile Synchronized", {
          description: `${name}'s parameters successfully updated in MongoDB.`,
          icon: <CheckCircle2 className="w-5 h-5 text-indigo-400" />
        });
        setShowEditModal(false);
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network connection error");
    }
  };

  const handleDeleteEmployee = async (id: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName} from the database?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/actions/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Employee Deleted", {
          description: `${empName} has been purged from system.`,
          icon: <Trash2 className="w-5 h-5 text-red-500" />
        });
        fetchEmployees();
      } else {
        toast.error("Failed to delete employee");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.department?.toLowerCase().includes(search.toLowerCase()) ||
    emp.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-400" />
            Organization Employee Directory
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Organization-wide employee management and status tracking.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by name, role, dept..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-white w-[250px] text-sm" 
            />
          </div>

          <Button 
            onClick={() => {
              // Reset and open
              setName("");
              setEmail("");
              setPassword("");
              setRole("employee");
              setDepartment("Engineering");
              setDesignation("Frontend Engineer");
              setSelectedManager("");
              setShowAddModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">System Role</th>
                <th className="px-6 py-4 font-semibold">Designation</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <motion.tr 
                  key={emp._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20 shrink-0">
                      {emp.name[0]}
                    </div>
                    <span>{emp.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{emp.email}</td>
                  <td className="px-6 py-4 text-slate-400">{emp.department || "Engineering"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${
                      emp.role === 'manager' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      emp.role === 'hr' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300">{emp.designation || "Specialist"}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(emp)} 
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteEmployee(emp._id, emp.name)} 
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500">
                    No matching organization employees found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold text-white">Register New Employee</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <Input 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. John Doe"
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <Input 
                      required 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="e.g. john@goalsphere.com"
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default Password</label>
                    <Input 
                      required 
                      type="password"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Role</label>
                    <select 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                    <Input 
                      required 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                      placeholder="e.g. Engineering"
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Designation</label>
                    <Input 
                      required 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)} 
                      placeholder="e.g. Senior Architect"
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports To (Manager)</label>
                    <select 
                      value={selectedManager} 
                      onChange={(e) => setSelectedManager(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">None / Self-Managed</option>
                      {managerList.map(mgr => (
                        <option key={mgr._id} value={mgr._id}>{mgr.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="border-slate-800 text-slate-400 hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Register User
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT EMPLOYEE MODAL */}
      <AnimatePresence>
        {showEditModal && editingEmployee && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <Edit2 className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold text-white">Edit Employee Parameters</h2>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditEmployee} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <Input 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Role</label>
                    <select 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                    <Input 
                      required 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Designation</label>
                    <Input 
                      required 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)} 
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports To (Manager)</label>
                    <select 
                      value={selectedManager} 
                      onChange={(e) => setSelectedManager(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">None / Self-Managed</option>
                      {managerList.filter(mgr => mgr._id !== editingEmployee._id).map(mgr => (
                        <option key={mgr._id} value={mgr._id}>{mgr.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="border-slate-800 text-slate-400 hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
