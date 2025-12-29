import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface MenuPermission {
  menu_id: number;
  menu_name: string;
  menu_code: string;
  module_code: string;
  parent_menu_id: number | null;
  icon: string | null;
  route: string | null;
  is_assigned: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_import: boolean;
  can_export: boolean;
  can_print: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface RoleMenuData {
  role_id: number;
  role_name: string;
  role_description: string;
  menu_count: number;
  menus: string;
}

const MenuAccessScreen: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleMenuData, setRoleMenuData] = useState<RoleMenuData[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<string>('');
  const [menus, setMenus] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingRoleMenu, setEditingRoleMenu] = useState<RoleMenuData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  const pageSize = 10;

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadRoleMenuTable();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (selectedRole) {
      loadRoleMenus(selectedRole);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      const response = await adminService.getRoles({ page: 1, per_page: 1000 });
      setRoles(response.data);
    } catch (error) {
      showToast('error', 'Failed to load roles');
    }
  };

  const loadRoleMenuTable = async () => {
    try {
      setTableLoading(true);
      const response = await adminService.getRoleMenuMappings({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined
      });
      
      setRoleMenuData(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load role menu data');
    } finally {
      setTableLoading(false);
    }
  };

  const loadRoleMenus = async (roleId: number) => {
    try {
      setLoading(true);
      // Fetch all menus and role-specific assigned menus, then merge
      const [allMenusResp, assignedResp] = await Promise.all([
        adminService.getAllMenus(),
        adminService.getRoleMenus(roleId)
      ]);

      const allMenus = allMenusResp?.data || [];
      const assigned = assignedResp?.data || [];

      // Normalize and merge: build MenuPermission objects from all menus
      const merged: MenuPermission[] = allMenus.map((m: any) => {
        // Normalize IDs to numbers so map lookups work reliably
        const menuId = m.id !== undefined && m.id !== null ? Number(m.id) : (m.menu_id !== undefined && m.menu_id !== null ? Number(m.menu_id) : NaN);
        const parentRaw = m.parent_id ?? m.parent_menu_id ?? null;
        const parentId = parentRaw !== null && parentRaw !== undefined ? Number(parentRaw) : null;

        // assigned item could reference menu by menu_id or id; coerce to number for comparison
        const assignedItem = assigned.find((a: any) => {
          const aMenuId = a.menu_id ?? a.id;
          return aMenuId !== undefined && aMenuId !== null && Number(aMenuId) === menuId;
        });

        const canCreate = !!(assignedItem?.can_create);
        const canUpdate = !!(assignedItem?.can_update);
        const canDelete = !!(assignedItem?.can_delete);
        const canImport = !!(assignedItem?.can_import);
        const canExport = !!(assignedItem?.can_export);
        const canPrint = !!(assignedItem?.can_print);

        const isAssigned = !!(assignedItem && (canCreate || canUpdate || canDelete || canImport || canExport || canPrint));

        return {
          menu_id: menuId,
          menu_name: m.name || m.menu_name || m.title || '',
          menu_code: m.code || m.menu_code || '',
          module_code: m.module_code || m.module || '',
          parent_menu_id: parentId,
          icon: m.icon ?? null,
          route: m.route ?? null,
          is_assigned: isAssigned,
          can_create: canCreate,
          can_update: canUpdate,
          can_delete: canDelete,
          can_import: canImport,
          can_export: canExport,
          can_print: canPrint
        } as MenuPermission;
      });

      // Also include any assigned menus not present in allMenus (defensive)
      const extraAssigned = assigned.filter((a: any) => !allMenus.some((m: any) => {
        const mId = m.id ?? m.menu_id;
        const aId = a.menu_id ?? a.id;
        return mId !== undefined && aId !== undefined && Number(mId) === Number(aId);
      }));
      extraAssigned.forEach((a: any) => {
        const menuId = a.menu_id ?? a.id;
        const parentRaw = a.parent_menu_id ?? a.parent_id ?? null;
        merged.push({
          menu_id: menuId !== undefined && menuId !== null ? Number(menuId) : NaN,
          menu_name: a.menu_name ?? a.name ?? '',
          menu_code: a.menu_code ?? a.code ?? '',
          module_code: a.module_code ?? a.module ?? '',
          parent_menu_id: parentRaw !== null && parentRaw !== undefined ? Number(parentRaw) : null,
          icon: a.icon ?? null,
          route: a.route ?? null,
          is_assigned: !!(a.is_assigned || a.can_create || a.can_update || a.can_delete || a.can_import || a.can_export || a.can_print),
          can_create: !!a.can_create,
          can_update: !!a.can_update,
          can_delete: !!a.can_delete,
          can_import: !!a.can_import,
          can_export: !!a.can_export,
          can_print: !!a.can_print
        });
      });

      setMenus(merged);

      // Update editingRoleMenu info if role has existing access
      const assignedCount = merged.filter((m: MenuPermission) => m.is_assigned).length;
      const hasExistingAccess = assignedCount > 0;
      if (hasExistingAccess && !editingRoleMenu) {
        const role = roles.find(r => r.id === roleId);
        if (role) {
          setEditingRoleMenu({
            role_id: roleId,
            role_name: role.name,
            role_description: role.description,
            menu_count: assignedCount,
            menus: ''
          });
        }
      }
    } catch (error) {
      showToast('error', 'Failed to load role menus');
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (value: string | number | (string | number)[]) => {
    const roleId = Array.isArray(value) ? Number(value[0]) : Number(value);
    const role = roles.find(r => r.id === roleId);
    setSelectedRole(roleId || null);
    setSelectedRoleName(role?.name || '');
    setIsFormCollapsed(false);
    setEditingRoleMenu(null);
  };

  const getChildMenuIds = (parentId: number): number[] => {
    const children = menus.filter(m => m.parent_menu_id === parentId);
    let allIds: number[] = [];
    children.forEach(child => {
      allIds.push(child.menu_id);
      allIds = allIds.concat(getChildMenuIds(child.menu_id));
    });
    return allIds;
  };

  const handlePermissionToggle = (menuId: number, permission: keyof MenuPermission) => {
    setMenus(menus.map(menu => {
      if (menu.menu_id === menuId) {
        const newValue = !menu[permission];
        const updatedMenu = { ...menu, [permission]: newValue };
        const hasAnyPermission = updatedMenu.can_create || updatedMenu.can_update || 
                                updatedMenu.can_delete || updatedMenu.can_import || 
                                updatedMenu.can_export || updatedMenu.can_print;
        return { ...updatedMenu, is_assigned: hasAnyPermission };
      }
      // If parent menu permission is toggled, apply to all children
      const childIds = getChildMenuIds(menuId);
      if (childIds.includes(menu.menu_id)) {
        const parentMenu = menus.find(m => m.menu_id === menuId);
        if (parentMenu) {
          const newValue = !parentMenu[permission];
          const updatedMenu = { ...menu, [permission]: newValue };
          const hasAnyPermission = updatedMenu.can_create || updatedMenu.can_update || 
                                  updatedMenu.can_delete || updatedMenu.can_import || 
                                  updatedMenu.can_export || updatedMenu.can_print;
          return { ...updatedMenu, is_assigned: hasAnyPermission };
        }
      }
      return menu;
    }));
  };

  const handleSave = async () => {
    if (!selectedRole) {
      showToast('error', 'Please select a role');
      return;
    }

    try {
      setSaving(true);
      await adminService.updateRoleMenus(selectedRole, menus);
      showToast('success', 'Role menu mappings updated successfully');
      loadRoleMenuTable();
    } catch (error) {
      showToast('error', 'Failed to update role menu mappings');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setSelectedRole(null);
    setSelectedRoleName('');
    setMenus([]);
  };

  const handleEdit = (roleMenu: RoleMenuData) => {
    const role = roles.find(r => r.id === roleMenu.role_id);
    if (role) {
      setEditingRoleMenu(roleMenu);
      setSelectedRole(role.id);
      setSelectedRoleName(role.name);
      setIsFormCollapsed(false);
    }
  };

  const handleCancel = () => {
    setEditingRoleMenu(null);
    handleClear();
  };

  const handleDelete = async (roleMenu: RoleMenuData) => {
    if (window.confirm(`Remove all menu access from ${roleMenu.role_name} role?`)) {
      try {
        await adminService.updateRoleMenus(roleMenu.role_id, []);
        showToast('success', 'All menu access removed successfully');
        loadRoleMenuTable();
      } catch (error) {
        showToast('error', 'Failed to remove menu access');
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    if (search !== searchTerm) {
      setSearchTerm(search);
      setCurrentPage(1);
    }
  };

  type MenuWithChildren = MenuPermission & { children: MenuWithChildren[] };

  const buildMenuTree = (): MenuWithChildren[] => {
    const menuMap = new Map<number, MenuWithChildren>();
    const rootMenus: MenuWithChildren[] = [];

    menus.forEach(menu => {
      menuMap.set(menu.menu_id, { ...menu, children: [] });
    });

    menus.forEach(menu => {
      const menuWithChildren = menuMap.get(menu.menu_id)!;
      if (menu.parent_menu_id) {
        const parent = menuMap.get(menu.parent_menu_id);
        if (parent) {
          parent.children.push(menuWithChildren);
        }
      } else {
        rootMenus.push(menuWithChildren);
      }
    });

    return rootMenus;
  };

  const groupByModule = (menuTree: MenuWithChildren[]) => {
    const grouped = new Map<string, MenuWithChildren[]>();
    menuTree.forEach(menu => {
      const module = menu.module_code;
      if (!grouped.has(module)) {
        grouped.set(module, []);
      }
      grouped.get(module)!.push(menu);
    });
    return grouped;
  };

  const toggleModule = (moduleCode: string) => {
    setCollapsedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleCode)) {
        newSet.delete(moduleCode);
      } else {
        newSet.add(moduleCode);
      }
      return newSet;
    });
  };

  const renderMenuRow = (menu: MenuWithChildren, level: number = 0) => {
    const indent = level * 24;
    return (
      <React.Fragment key={menu.menu_id}>
        <tr className={level > 0 ? 'bg-gray-50' : ''}>
          <td className="px-4 py-3 text-sm" style={{ paddingLeft: `${16 + indent}px` }}>
            <span className={level === 0 ? 'font-medium' : ''}>
              {menu.icon && <span className="mr-2">{menu.icon}</span>}
              {menu.menu_name}
            </span>
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="checkbox"
              checked={menu.can_create}
              onChange={() => handlePermissionToggle(menu.menu_id, 'can_create')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="checkbox"
              checked={menu.can_update}
              onChange={() => handlePermissionToggle(menu.menu_id, 'can_update')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="checkbox"
              checked={menu.can_delete}
              onChange={() => handlePermissionToggle(menu.menu_id, 'can_delete')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="checkbox"
              checked={menu.can_import}
              onChange={() => handlePermissionToggle(menu.menu_id, 'can_import')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="checkbox"
              checked={menu.can_export}
              onChange={() => handlePermissionToggle(menu.menu_id, 'can_export')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="checkbox"
              checked={menu.can_print}
              onChange={() => handlePermissionToggle(menu.menu_id, 'can_print')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </td>
        </tr>
        {menu.children.map(child => renderMenuRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const menuTree = buildMenuTree();

  const columns = [
    { key: 'role_name', label: 'Role Name' },
    { key: 'role_description', label: 'Description' },
    {
      key: 'menus',
      label: 'Menus',
      render: (menus: string, row: RoleMenuData) => (
        <span className="text-sm">
          {menus} ({row.menu_count})
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingRoleMenu ? `Edit Menu Access for ${editingRoleMenu.role_name}` : 'Configure Menu Access'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFormCollapsed(!isFormCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isFormCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {!isFormCollapsed && (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role
                </label>
                <SearchableDropdown
                  options={roles.map(role => ({ value: role.id, label: role.name }))}
                  value={selectedRole || ''}
                  onChange={handleRoleChange}
                  placeholder="Select Role"
                  multiple={false}
                  searchable={true}
                  disabled={!!editingRoleMenu}
                  className="w-full"
                />
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading menus...</p>
              </div>
            )}

            <div className="mb-4 border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                        Menu
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                        Create
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                        Update
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                        Delete
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                        Import
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                        Export
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                        Print
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-600">Loading menus...</p>
                        </td>
                      </tr>
                    ) : !selectedRole ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Please select a role to configure menu access
                        </td>
                      </tr>
                    ) : menuTree.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No menus available
                        </td>
                      </tr>
                    ) : (
                      Array.from(groupByModule(menuTree)).map(([moduleCode, moduleMenus]) => (
                        <React.Fragment key={moduleCode}>
                          <tr className="bg-blue-50 cursor-pointer hover:bg-blue-100" onClick={() => toggleModule(moduleCode)}>
                            <td colSpan={7} className="px-4 py-2 font-semibold text-gray-800">
                              <div className="flex items-center">
                                {collapsedModules.has(moduleCode) ? (
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                ) : (
                                  <ChevronUp className="h-4 w-4 mr-2" />
                                )}
                                {moduleCode.toUpperCase()}
                              </div>
                            </td>
                          </tr>
                          {!collapsedModules.has(moduleCode) && moduleMenus.map(menu => renderMenuRow(menu))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedRole}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingRoleMenu ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table Section */}
      <DataTable
        title="Role Menu Access"
        columns={columns}
        data={roleMenuData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={tableLoading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default MenuAccessScreen;
