const Usuario = require("../models/Usuario");
const Proyecto = require("../models/Proyecto");
const Tarea = require("../models/Tarea");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

// Crea y firma un JWT
const crearToken = (usuario, secreta, expiresIn) => {
  const { id, nombre, email } = usuario;

  return jwt.sign({ id, nombre, email }, secreta, { expiresIn });
};

const resolvers = {
  Query: {
    obtenerProyectos: async (_, {}, ctx) => {
      const proyectos = await Proyecto.find({ creador: ctx.id });

      return proyectos;
    },

    obtenerTareas: async (_, { input }, ctx) => {
      const tareas = await Tarea.find({ creador: ctx.id })
        .where("proyecto")
        .equals(input.proyecto);

      return tareas;
    },
  },

  Mutation: {
    crearUsuario: async (_, { input }) => {
      const { email, password } = input;

      const existeUsuario = await Usuario.findOne({ email });

      if (existeUsuario) {
        throw new Error("El usuario ya está registrado");
      }

      try {
        // Hashear password
        input.password = await bcrypt.hash(password, 10);

        // Registrar nuevo usuario.
        const nuevoUsuario = new Usuario(input);
        nuevoUsuario.save();

        return "Usuario Creado Correctamente";
      } catch (error) {
        console.log(error.errors.message);
      }
    },

    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      // Si el usuario existe
      const existeUsuario = await Usuario.findOne({ email });

      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      // Si el password es correcto
      const passwordCorrecto = await bcrypt.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error("Password incorrecto");
      }

      // Dar acceso a la app
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, "2hr"),
      };
    },

    nuevoProyecto: async (_, { input }, ctx) => {
      try {
        const proyecto = new Proyecto(input);

        // Asociar el creador
        proyecto.creador = ctx.id;

        // Almacenar en la DB
        const resultado = await proyecto.save();

        return resultado;
      } catch (error) {
        console.log(error);
      }
    },

    actualizarProyecto: async (_, { id, input }, ctx) => {
      // Revisar que el proyecto existe o no
      let proyecto = await Proyecto.findById(id);
      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }

      // Revisar que si la persona que trata de editarlo es el creador
      if (proyecto.creador.toString() !== ctx.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      // Guardar el proyecto
      proyecto = await Proyecto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });

      return proyecto;
    },

    eliminarProyecto: async (_, { id }, ctx) => {
      // Revisar que el proyecto existe o no
      let proyecto = await Proyecto.findById(id);
      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }

      // Revisar que si la persona que trata de editarlo es el creador
      if (proyecto.creador.toString() !== ctx.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      // Eliminar
      await Proyecto.findOneAndDelete({ _id: id });

      return "Proyecto Eliminado";
    },

    nuevaTarea: async (_, { input }, ctx) => {
      try {
        const tarea = new Tarea(input);
        tarea.creador = ctx.id;

        const resultado = await tarea.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },

    actualizarTarea: async (_, { id, input, estado }, ctx) => {
      // Si la tarea existe
      let tarea = await Tarea.findById(id);
      if (!tarea) {
        throw new Error("Tarea no encontrada");
      }

      // Si la persona que edita es el creador
      if (tarea.creador.toString() !== ctx.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      // Asignar el estado
      input.estado = estado;

      // Guardar y retornar la tarea
      tarea = await Tarea.findOneAndUpdate({ _id: id }, input, { new: true });

      return tarea;
    },

    eliminarTarea: async (_, { id }, ctx) => {
      // Si la tarea existe
      let tarea = await Tarea.findById(id);
      if (!tarea) {
        throw new Error("Tarea no encontrada");
      }

      // Si la persona que edita es el creador
      if (tarea.creador.toString() !== ctx.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      // Eliminar
      await Tarea.findOneAndDelete({ _id: id });

      return "Tarea Eliminada";
    },
  },
};

module.exports = resolvers;
