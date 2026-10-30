import pageService from "../service/pageService.js";

export const createPage = async (req, res) => {
  try {
    const page = await pageService.createPage(req.body);

    res.status(201).json({
      success: true,
      message: "✅ Page created successfully",
      data: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPages = async (req, res) => {
  try {
    const cacheKey = `pages:all`;


    const pages = await pageService.getAllPages();

    res.status(200).json({
      success: true,
      message: "📄 All pages fetched successfully",
      data: pages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPageById = async (req, res) => {
  try {
    const page = await pageService.getPageById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "❌ Page not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "📄 Page fetched successfully",
      data: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePage = async (req, res) => {
  try {
    const page = await pageService.updatePage(req.params.id, req.body);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "❌ Page not found for update",
      });
    }


    res.status(200).json({
      success: true,
      message: "✅ Page updated successfully",
      data: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePage = async (req, res) => {
  try {
    await pageService.deletePage(req.params.id);


    res.status(200).json({
      success: true,
      message: "🗑️ Page deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
