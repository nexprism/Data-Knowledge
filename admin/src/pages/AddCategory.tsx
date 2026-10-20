import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createCourseCategory ,createSubCategory} from "../store/slices/courseCategorySlice";
import type { AppDispatch, RootState } from "../store";
import toast, { Toaster } from "react-hot-toast";
import PopupAlert from "../components/popUpAlert";

interface SubCategoryInput {
  name: string;
}

export default function AddCategory() {
  const [category, setCategory] = useState({
    name: "",
    status: "active",
    image: null as File | null,
  });
  const [addSubcategory, setAddSubcategory] = useState(false);
  const [subcategories, setSubcategories] = useState<SubCategoryInput[]>([]);
    const [popup, setPopup] = useState({ isVisible: false, message: '', type: '' });
  
 

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.courseCategory.loading);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setCategory({ ...category, [e.target.name]: e.target.value });
 
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCategory({ ...category, image: e.target.files[0] });
   
    }
  };

  const handleAddSubcategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddSubcategory(e.target.checked);
    if (e.target.checked) {
      setSubcategories([{ name: "" }]);
    } else {
      setSubcategories([]);
    }
  };

  const handleSubcategoryChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSubcategories = [...subcategories];
    const key = e.target.name as keyof SubCategoryInput;
    newSubcategories[index][key] = e.target.value;
    setSubcategories(newSubcategories);
  };

  const addSubcategoryField = () => {
    setSubcategories([...subcategories, { name: "" }]);
  };

  const removeSubcategoryField = (index: number) => {
    const newSubcategories = subcategories.filter((_, i) => i !== index);
    setSubcategories(newSubcategories);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!category.name) {
    toast.error("Category name is required.", {
      duration: 8000,
      position: 'top-right',
    });
    return;
  }

  const formData = new FormData();
  formData.append("name", category.name);
  formData.append("status", category.status);
  if (category.image) {
    formData.append("image", category.image);
  }

  try {
    // Create the main category and get the result (should include the new category's ID)
    const createdCategory = await dispatch(createCourseCategory(formData) as any).unwrap();

    console.log("Created Category:", addSubcategory,subcategories, createdCategory);

    // If subcategories are to be added, dispatch createSubCategory for each non-empty entry
    if (addSubcategory && subcategories.length > 0 && createdCategory?._id) {
      const validSubs = subcategories.filter(s => s.name && s.name.trim() !== "");
      if (validSubs.length > 0) {
        await Promise.all(
          validSubs.map((sub) =>
            dispatch(
              createSubCategory({
                name: sub.name.trim(),
                categoryId: createdCategory._id,
                slug: "",
                status: "active"
              }) as any
            ).unwrap()
          )
        );
      }
    }

     setPopup({
    isVisible: true,
    message: 'Category created successfully!',
    type: 'success'
  });
    setCategory({ name: "", status: "active", image: null });
    setSubcategories([]);
    setAddSubcategory(false);
  } catch (err: any) {
    setPopup({
    isVisible: true,
    message: 'Failed to create Category. Please try again.',
    type: 'error'
  });
  }
};



  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Add Category | IAS"
        description="Add a new category page for IAS"
      />
      <PageBreadcrumb pageTitle="Add Category" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full ">
          <h3 className="mb-6 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Add New Category
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Fields */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={category.name}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Enter category name"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                value={category.status}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Image
              </label>
              <input
                type="file"
                name="image"
                onChange={handleImageChange}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {category.image && typeof category.image !== 'string' && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(category.image)}
                    alt="Category Preview"
                    className="max-w-xs h-auto rounded"
                  />
                </div>
              )}
            </div>

            {/* Add Subcategory Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="addSubcategory"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                checked={addSubcategory}
                onChange={handleAddSubcategoryChange}
              />
              <label
                htmlFor="addSubcategory"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Add Subcategory
              </label>
            </div>

            {/* Subcategory Fields */}
            {addSubcategory && (
              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Subcategories
                </h4>
                {subcategories.map((subcategory, index) => (
                  <div key={index} className="space-y-2 border border-gray-200 rounded-md p-4 dark:border-gray-700">
                    <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
                      <h5 className="text-md font-medium text-gray-700 dark:text-gray-300">
                        Subcategory #{index + 1}
                      </h5>
                      {subcategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubcategoryField(index)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subcategory Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={subcategory.name}
                        onChange={(e) => handleSubcategoryChange(index, e)}
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter subcategory name"
                        required
                      />
                    </div>
                 
                  </div>
                ))}
                {addSubcategory && (
                  <button
                    type="button"
                    onClick={addSubcategoryField}
                    className="rounded bg-gray-300 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-400 transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Add Another Subcategory
                  </button>
                )}
              </div>
            )}

       
            {/* Submit Button */}
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] px-6 py-2.5 text-white font-semibold shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>
      </div>
       <PopupAlert 
  message={popup.message}
  type={popup.type}
  isVisible={popup.isVisible}
  onClose={() => setPopup({ ...popup, isVisible: false })}
/>
    </div>
  );
}
